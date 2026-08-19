# ExtraFun Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a member finder (browse profiles, like/match, block/report) on extrafun.pl reading the shared Supabase auth + profile tables, gated by a new per-portal opt-out, then softly remove the discovery grid from bizarriusz.

**Architecture:** All three portals share one Supabase project (`lvxaycjuhchoqhnttyjj`): profiles live in auth `user_metadata`; `profile_likes/profile_blocks/profile_reports/user_gallery` are shared tables. So this is a build + visibility problem, not a migration. The extrafun server (`morefun/server/routes.js`, plain JS + Express) gains finder endpoints that project only safe public fields; the client gains a `Finder.jsx` page. Visibility honors `hidden_from_search` AND a new `hidden_from_extrafun`. Rolled out in 3 phases: read-only → engagement → consent broadcast + biz cutover.

**Tech Stack:** Node/Express (JS, ESM), `@supabase/supabase-js` service-role client (`supabaseAdmin`), React (Vite, JSX), shared Supabase Postgres.

**Verification note:** extrafun has no test suite and does not run locally (no `DATABASE_URL`/service key locally — known pattern). Every task is verified against **prod after deploy** via `curl`/browser and SQL through the Supabase MCP. Deploy = push to `main` (Railway auto-deploys, ~1-2 min).

**Auth/token note:** protected endpoints use `verifyJWT`; public-but-personalized use `optionalAuth` (both in `morefun/server/auth.js`). The client sends `Authorization: Bearer <supabase access_token>`; reuse the existing client fetch/auth pattern from `morefun/src/pages/Ogloszenia.jsx` + `morefun/src/hooks/useAuth.jsx`.

**Reference source (port FROM):** `bizarriusz/server/routes/finder.ts` — the TS finder this ports to JS. Read it before Phase 1.

---

## Phase 1 — Read-only finder on extrafun (default hidden until consent)

Profiles are DEFAULT HIDDEN on extrafun in this phase (a `FINDER_LIVE` flag serves count-only to everyone) so nothing is exposed before the Phase-3 consent DM. This lets us build and verify the UI safely.

### Task 1: Visibility helper + listing endpoint (count-only gate)

**Files:**
- Modify: `morefun/server/routes.js` (add inside `registerRoutes(app)`, after the `/api/ads` block near line 229)

- [ ] **Step 1: Add the shared visibility loader + listing endpoint**

Add near the top of `registerRoutes` (module-level `const` above `registerRoutes`, and the route inside it). Ported from `finder.ts` `loadVisibleProfiles` + `GET /api/finder`:

```js
// --- FINDER (member catalog) -------------------------------------------------
// Profiles live in Supabase auth user_metadata (shared across portals). Project
// ONLY safe public fields — never email. Excludes hidden_from_search (biz opt-out)
// AND hidden_from_extrafun (this portal's opt-out). Gated OFF (count-only) until
// the consent DM goes out — see Phase 3.
const FINDER_LIVE = false; // Phase 3 flips this to true after the heads-up broadcast
let _finderCache = null;   // { at, profiles }
const FINDER_TTL_MS = 60_000;

async function loadVisibleProfiles() {
  if (_finderCache && Date.now() - _finderCache.at < FINDER_TTL_MS) return _finderCache.profiles;
  const rows = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      const m = u.user_metadata || {};
      const name = String(m.full_name || m.name || m.display_name || '').trim();
      if (!name) continue;                          // only filled profiles
      if (m.hidden_from_search === true) continue;  // biz opt-out
      if (m.hidden_from_extrafun === true) continue; // extrafun opt-out
      const lastSeen = u.last_sign_in_at || u.created_at || '';
      rows.push({
        id: u.id,
        displayName: name.slice(0, 50),
        age: m.age ? Number(m.age) : null,
        lookingFor: m.looking_for ? String(m.looking_for).slice(0, 160) : null,
        avatarUrl: m.avatar_url || null,
        createdAt: u.created_at || '',
        lastSeen,
      });
    }
    if (data.users.length < 200) break;
  }
  rows.sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
  // Fallback avatar: newest gallery photo for anyone without an avatar.
  const noAvatar = rows.filter(p => !p.avatarUrl).map(p => p.id);
  if (noAvatar.length) {
    const { data: g } = await supabaseAdmin.from('user_gallery')
      .select('user_id, image_url, created_at').in('user_id', noAvatar)
      .order('created_at', { ascending: false });
    const first = new Map();
    for (const row of (g || [])) if (!first.has(row.user_id)) first.set(row.user_id, row.image_url);
    for (const p of rows) if (!p.avatarUrl && first.has(p.id)) p.avatarUrl = first.get(p.id);
  }
  _finderCache = { at: Date.now(), profiles: rows };
  return rows;
}

// Bidirectional block set for a user.
async function finderBlockedSet(me) {
  const { data } = await supabaseAdmin.from('profile_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${me},blocked_id.eq.${me}`);
  const s = new Set();
  for (const r of (data || [])) s.add(r.blocker_id === me ? r.blocked_id : r.blocker_id);
  return s;
}

app.get('/api/finder', optionalAuth, async (req, res) => {
  try {
    const all = await loadVisibleProfiles();
    if (!FINDER_LIVE || !req.user) return res.json({ count: all.length, locked: true });
    const me = req.user.id;
    const blocks = await finderBlockedSet(me);
    const q = String(req.query.q || '').trim().toLowerCase();
    const mode = String(req.query.mode || 'all');
    let items = all.filter(p => p.id !== me && !blocks.has(p.id));
    if (mode === 'photos') items = items.filter(p => !!p.avatarUrl);
    else if (mode === 'new') items = [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    else if (mode === 'active') {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
      items = items.filter(p => p.lastSeen >= cutoff);
    }
    const minAge = parseInt(req.query.minAge, 10);
    const maxAge = parseInt(req.query.maxAge, 10);
    if (!Number.isNaN(minAge) || !Number.isNaN(maxAge)) {
      const lo = Number.isNaN(minAge) ? 0 : minAge, hi = Number.isNaN(maxAge) ? 200 : maxAge;
      items = items.filter(p => p.age != null && p.age >= lo && p.age <= hi);
    }
    if (q) items = items.filter(p => p.displayName.toLowerCase().includes(q) || (p.lookingFor || '').toLowerCase().includes(q));
    res.json({ count: items.length, locked: false, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

- [ ] **Step 2: Import optionalAuth**

Modify the top import in `morefun/server/routes.js:2`:

```js
import { verifyJWT, optionalAuth, isAdmin, isAdminEmail } from './auth.js'
```

- [ ] **Step 3: Commit**

```bash
git add server/routes.js
git commit -m "feat(finder): visibility loader + count-only listing endpoint (gated off)"
```

- [ ] **Step 4: Deploy + verify guest = count-only**

Push, wait ~2 min, then verify the endpoint returns a count and NO rows (gated off, guest):

Run (via Supabase MCP or authorized curl): `curl -s https://extrafun.pl/api/finder`
Expected: `{"count":<n>,"locked":true}` with NO `items` array.

```bash
git push origin main
```

### Task 2: Profile detail endpoint (lean — no biz groups/checkin/ads)

**Files:**
- Modify: `morefun/server/routes.js` (after the `/api/finder` listing)

- [ ] **Step 1: Add `GET /api/finder/:id`**

Ported/trimmed from `finder.ts` `GET /api/finder/:id` — omits biz groups, club check-in, biz ads:

```js
app.get('/api/finder/:id', optionalAuth, async (req, res) => {
  try {
    if (!FINDER_LIVE || !req.user) return res.status(404).json({ message: 'Nie znaleziono' });
    const id = String(req.params.id);
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error || !data.user) return res.status(404).json({ message: 'Nie znaleziono' });
    const m = data.user.user_metadata || {};
    const name = String(m.full_name || m.name || m.display_name || '').trim();
    if (!name || m.hidden_from_search === true || m.hidden_from_extrafun === true)
      return res.status(404).json({ message: 'Nie znaleziono' });

    const me = req.user.id;
    if (me !== id) {
      const { data: blk } = await supabaseAdmin.from('profile_blocks').select('id').or(
        `and(blocker_id.eq.${me},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${me})`
      ).limit(1);
      if (blk && blk.length) return res.status(404).json({ message: 'Nie znaleziono' });
    }

    const { data: gallery } = await supabaseAdmin.from('user_gallery')
      .select('image_url').eq('user_id', id).order('created_at', { ascending: false }).limit(30);
    const { count: likeCount } = await supabaseAdmin.from('profile_likes')
      .select('id', { count: 'exact', head: true }).eq('liked_id', id);
    let likedByMe = false, likesMe = false;
    if (me !== id) {
      const { data: mine } = await supabaseAdmin.from('profile_likes').select('id')
        .eq('liker_id', me).eq('liked_id', id).limit(1);
      const { data: theirs } = await supabaseAdmin.from('profile_likes').select('id')
        .eq('liker_id', id).eq('liked_id', me).limit(1);
      likedByMe = !!(mine && mine.length);
      likesMe = !!(theirs && theirs.length);
    }
    const prompts = Array.isArray(m.prompts)
      ? m.prompts.filter(p => p && typeof p.q === 'string' && typeof p.a === 'string')
          .slice(0, 5).map(p => ({ q: String(p.q).slice(0, 80), a: String(p.a).slice(0, 300) }))
      : [];
    res.json({
      id,
      displayName: name.slice(0, 50),
      age: m.age ? Number(m.age) : null,
      about: m.about ? String(m.about).slice(0, 600) : null,
      lookingFor: m.looking_for ? String(m.looking_for).slice(0, 600) : null,
      avatarUrl: m.avatar_url || (gallery && gallery[0]?.image_url) || null,
      prompts,
      likeCount: likeCount || 0,
      likedByMe, likesMe, isMatch: likedByMe && likesMe,
      gallery: (gallery || []).map(g => g.image_url),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

- [ ] **Step 2: Commit + deploy**

```bash
git add server/routes.js
git commit -m "feat(finder): lean profile detail endpoint"
git push origin main
```

- [ ] **Step 3: Verify**

Gated off → any id returns 404. After Phase 3 (`FINDER_LIVE=true`), a real id returns the profile shape above. For now:
Run: `curl -s https://extrafun.pl/api/finder/<any-uuid>`
Expected: `{"message":"Nie znaleziono"}` (gated).

### Task 3: `hidden_from_extrafun` opt-out endpoint

**Files:**
- Modify: `morefun/server/routes.js`

- [ ] **Step 1: Add read + write of the flag (writes auth user_metadata)**

The flag lives in `user_metadata`, so it must go through `auth.admin.updateUserById` (NOT the `profiles` table that `PUT /api/profile` uses):

```js
app.get('/api/finder/me/visibility', verifyJWT, async (req, res) => {
  res.json({ hiddenFromExtrafun: req.user.meta?.hidden_from_extrafun === true });
});

app.post('/api/finder/me/visibility', verifyJWT, async (req, res) => {
  const hidden = !!req.body?.hidden;
  const current = req.user.meta || {};
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
    user_metadata: { ...current, hidden_from_extrafun: hidden },
  });
  if (error) return res.status(500).json({ message: error.message });
  _finderCache = null; // bust the cache so the change shows within a request
  res.json({ hiddenFromExtrafun: hidden });
});
```

- [ ] **Step 2: Commit + deploy**

```bash
git add server/routes.js
git commit -m "feat(finder): per-portal hidden_from_extrafun opt-out endpoint"
git push origin main
```

- [ ] **Step 3: Verify (authorized)**

Logged-in `POST /api/finder/me/visibility {hidden:true}` → `{"hiddenFromExtrafun":true}`; GET reflects it. Verify the auth row changed:
Run (Supabase MCP): `SELECT raw_user_meta_data->>'hidden_from_extrafun' FROM auth.users WHERE id='<my-id>';`
Expected: `true`.

### Task 4: Finder client page + nav (grid, count-locked state)

**Files:**
- Create: `morefun/src/pages/Finder.jsx`
- Modify: `morefun/src/components/BottomNav.jsx` (add nav item)
- Modify: `morefun/src/App.jsx` (route the `szukaj` id to `<Finder/>`)

- [ ] **Step 1: Add the nav item**

In `morefun/src/components/BottomNav.jsx`, add to `NAV_ITEMS` (after `ogloszenia`):

```jsx
  {
    id: 'szukaj',
    label: 'Szukaj',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    )
  },
```

- [ ] **Step 2: Create `Finder.jsx`**

Mirror the fetch/auth pattern and Nocturne card styling from `morefun/src/pages/Ogloszenia.jsx` (read it for the exact `useAuth` hook, token header, and CSS classes). Functional page:

```jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

const MODES = [
  { id: 'all', label: 'Wszyscy' },
  { id: 'photos', label: 'Ze zdjęciem' },
  { id: 'new', label: 'Nowi' },
  { id: 'active', label: 'Aktywni' },
]

export default function Finder({ onOpenProfile }) {
  const { session } = useAuth()
  const [state, setState] = useState({ loading: true, locked: false, count: 0, items: [] })
  const [mode, setMode] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    const params = new URLSearchParams({ mode })
    if (q.trim()) params.set('q', q.trim())
    fetch(`/api/finder?${params}`, { headers })
      .then(r => r.json())
      .then(d => { if (alive) setState({ loading: false, locked: !!d.locked, count: d.count || 0, items: d.items || [] }) })
      .catch(() => { if (alive) setState(s => ({ ...s, loading: false })) })
    return () => { alive = false }
  }, [session, mode, q])

  if (state.loading) return <div className="finder-loading">Ładowanie…</div>
  if (state.locked) {
    return (
      <div className="finder-locked">
        <p>Katalog profili wkrótce. Zalogowani goście zobaczą tu {state.count} osób.</p>
      </div>
    )
  }
  return (
    <div className="finder">
      <div className="finder-controls">
        <input className="finder-search" placeholder="Szukaj…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="finder-modes">
          {MODES.map(m => (
            <button key={m.id} className={`chip ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>
      </div>
      <div className="finder-grid">
        {state.items.map(p => (
          <button key={p.id} className="finder-card" onClick={() => onOpenProfile?.(p.id)}>
            <div className="finder-avatar">
              {p.avatarUrl ? <img src={p.avatarUrl} alt="" loading="lazy" /> : <span>{p.displayName[0]?.toUpperCase() || '?'}</span>}
            </div>
            <div className="finder-name">{p.displayName}{p.age ? `, ${p.age}` : ''}</div>
            {p.lookingFor && <div className="finder-looking">{p.lookingFor}</div>}
          </button>
        ))}
        {state.items.length === 0 && <div className="finder-empty">Brak wyników.</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into App.jsx**

In `morefun/src/App.jsx`, import `Finder` and render it when the active nav id is `szukaj` (follow the existing switch/route pattern used for `ogloszenia`). Pass `onOpenProfile={(id) => setActiveProfile(id)}` — the profile view is Task 5; for Phase 1 a stub that logs is fine.

```jsx
import Finder from './pages/Finder.jsx'
// ...in the page switch:
{active === 'szukaj' && <Finder onOpenProfile={(id) => setProfileId(id)} />}
```

- [ ] **Step 4: Add minimal CSS**

In `morefun/src/index.css`, add `.finder-grid` (responsive grid), `.finder-card`, `.finder-avatar` (square, object-fit cover), `.chip`/`.chip.active`, using the existing Nocturne color variables already defined in that file (match the `.ogloszenia`/card classes already present).

- [ ] **Step 5: Commit + deploy + verify**

```bash
git add src/pages/Finder.jsx src/components/BottomNav.jsx src/App.jsx src/index.css
git commit -m "feat(finder): client page + nav (locked state in phase 1)"
git push origin main
```

Verify in browser (prod): the `Szukaj` tab shows the locked message (count only), no rows, no console errors.

---

## Phase 2 — Engagement (like / match / block / report)

Still gated (`FINDER_LIVE=false`) so these are testable by an admin flipping the flag locally-in-a-branch or after Phase 3. Endpoints are safe to ship gated.

### Task 5: Like toggle + "who liked me"

**Files:**
- Modify: `morefun/server/routes.js`

- [ ] **Step 1: Add like toggle + likers list**

Ported from `finder.ts` (no push — extrafun has no VAPID configured; a match is discoverable via the "who liked me" list):

```js
app.post('/api/finder/:id/like', verifyJWT, async (req, res) => {
  try {
    if (!FINDER_LIVE) return res.status(404).json({ message: 'Nie znaleziono' });
    const likedId = String(req.params.id), likerId = req.user.id;
    if (likedId === likerId) return res.status(400).json({ message: 'Nie możesz polubić siebie' });
    const { data: tu } = await supabaseAdmin.auth.admin.getUserById(likedId);
    const tm = tu?.user?.user_metadata || {};
    const tname = String(tm.full_name || tm.name || tm.display_name || '').trim();
    if (!tu?.user || !tname || tm.hidden_from_search === true || tm.hidden_from_extrafun === true)
      return res.status(404).json({ message: 'Nie znaleziono' });
    const { data: blk } = await supabaseAdmin.from('profile_blocks').select('id').or(
      `and(blocker_id.eq.${likerId},blocked_id.eq.${likedId}),and(blocker_id.eq.${likedId},blocked_id.eq.${likerId})`
    ).limit(1);
    if (blk && blk.length) return res.status(404).json({ message: 'Nie znaleziono' });
    const { data: ex } = await supabaseAdmin.from('profile_likes').select('id')
      .eq('liker_id', likerId).eq('liked_id', likedId).limit(1);
    if (ex && ex.length) {
      await supabaseAdmin.from('profile_likes').delete().eq('id', ex[0].id);
      return res.json({ liked: false });
    }
    const { error } = await supabaseAdmin.from('profile_likes').insert({ liker_id: likerId, liked_id: likedId });
    if (error) return res.status(500).json({ message: error.message });
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/finder/likes/me', verifyJWT, async (req, res) => {
  try {
    const me = req.user.id;
    const { data: likes } = await supabaseAdmin.from('profile_likes')
      .select('liker_id, created_at').eq('liked_id', me)
      .order('created_at', { ascending: false }).limit(200);
    const visible = await loadVisibleProfiles();
    const byId = new Map(visible.map(p => [p.id, p]));
    const items = (likes || []).map(l => {
      const p = byId.get(l.liker_id);
      return p ? { id: p.id, displayName: p.displayName, age: p.age, avatarUrl: p.avatarUrl, createdAt: l.created_at }
               : { id: null, displayName: 'Ktoś', age: null, avatarUrl: null, createdAt: l.created_at };
    });
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

- [ ] **Step 2: Commit + deploy**

```bash
git add server/routes.js
git commit -m "feat(finder): like toggle + who-liked-me (no push)"
git push origin main
```

### Task 6: Block + report

**Files:**
- Modify: `morefun/server/routes.js`

- [ ] **Step 1: Add block (bidirectional, clears likes) + report**

```js
app.post('/api/finder/:id/block', verifyJWT, async (req, res) => {
  try {
    const blockedId = String(req.params.id), blockerId = req.user.id;
    if (blockedId === blockerId) return res.status(400).json({ message: 'Nie możesz zablokować siebie' });
    const { data: ex } = await supabaseAdmin.from('profile_blocks').select('id')
      .eq('blocker_id', blockerId).eq('blocked_id', blockedId).limit(1);
    if (ex && ex.length) {
      await supabaseAdmin.from('profile_blocks').delete().eq('id', ex[0].id);
      return res.json({ blocked: false });
    }
    await supabaseAdmin.from('profile_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    await supabaseAdmin.from('profile_likes').delete().or(
      `and(liker_id.eq.${blockerId},liked_id.eq.${blockedId}),and(liker_id.eq.${blockedId},liked_id.eq.${blockerId})`
    );
    res.json({ blocked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/finder/:id/report', verifyJWT, async (req, res) => {
  try {
    const reportedId = String(req.params.id), reporterId = req.user.id;
    if (reportedId === reporterId) return res.status(400).json({ message: 'Nie możesz zgłosić siebie' });
    const reason = String(req.body?.reason || '').trim().slice(0, 300) || null;
    await supabaseAdmin.from('profile_reports').insert({ reporter_id: reporterId, reported_id: reportedId, reason });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

- [ ] **Step 2: Commit + deploy**

```bash
git add server/routes.js
git commit -m "feat(finder): block (clears likes) + report"
git push origin main
```

### Task 7: Profile detail view + like/block/report UI + visibility toggle

**Files:**
- Create: `morefun/src/pages/FinderProfile.jsx`
- Modify: `morefun/src/App.jsx` (render profile when `profileId` set)
- Modify: the profile/settings page (where own profile is edited) to add the visibility toggle

- [ ] **Step 1: Create `FinderProfile.jsx`**

Fetches `/api/finder/:id`, renders name/age/about/lookingFor/gallery/prompts, and Like / Block / Report buttons calling the Phase-2 endpoints (Bearer token via `useAuth`). Show `isMatch` badge when mutual. Mirror `Ogloszenia.jsx` modal/detail styling.

```jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function FinderProfile({ id, onClose }) {
  const { session } = useAuth()
  const [p, setP] = useState(null)
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : {}
  const load = () => fetch(`/api/finder/${id}`, { headers }).then(r => r.ok ? r.json() : null).then(setP)
  useEffect(() => { load() }, [id])
  if (!p) return null
  const like = () => fetch(`/api/finder/${id}/like`, { method: 'POST', headers }).then(load)
  const block = () => fetch(`/api/finder/${id}/block`, { method: 'POST', headers }).then(onClose)
  const report = () => { const reason = prompt('Powód zgłoszenia?') || ''; fetch(`/api/finder/${id}/report`, { method: 'POST', headers, body: JSON.stringify({ reason }) }) }
  return (
    <div className="finder-profile">
      <button className="finder-close" onClick={onClose}>×</button>
      <h2>{p.displayName}{p.age ? `, ${p.age}` : ''} {p.isMatch && <span className="match-badge">💞 match</span>}</h2>
      {p.lookingFor && <p className="finder-looking">{p.lookingFor}</p>}
      {p.about && <p>{p.about}</p>}
      {p.prompts?.map((pr, i) => <div key={i} className="finder-prompt"><b>{pr.q}</b><div>{pr.a}</div></div>)}
      <div className="finder-gallery">{p.gallery?.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}</div>
      <div className="finder-actions">
        <button onClick={like}>{p.likedByMe ? '💔 Cofnij' : '❤️ Lubię'}</button>
        <button onClick={block}>Zablokuj</button>
        <button onClick={report}>Zgłoś</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the own-profile visibility toggle**

On the extrafun profile/settings page, add a checkbox bound to `/api/finder/me/visibility`:

```jsx
// read on mount:
fetch('/api/finder/me/visibility', { headers }).then(r => r.json()).then(d => setHidden(d.hiddenFromExtrafun))
// on change:
const toggle = (v) => fetch('/api/finder/me/visibility', { method: 'POST', headers, body: JSON.stringify({ hidden: v }) }).then(r => r.json()).then(d => setHidden(d.hiddenFromExtrafun))
// UI:
<label><input type="checkbox" checked={hidden} onChange={e => toggle(e.target.checked)} /> Ukryj mnie w Szukaj na extrafun</label>
```

- [ ] **Step 3: Commit + deploy**

```bash
git add src/pages/FinderProfile.jsx src/App.jsx src/index.css
git commit -m "feat(finder): profile detail view + like/block/report + visibility toggle"
git push origin main
```

---

## Phase 3 — Consent broadcast + biz cutover

### Task 8: Heads-up DM broadcast (idempotent) + flip FINDER_LIVE

**Files:**
- Modify: `morefun/server/routes.js`

- [ ] **Step 1: Add the admin broadcast endpoint**

DMs every user (via shared `private_messages`) the extrafun heads-up. Idempotent via a `site_config` marker (create the row-or-skip). Mirrors the biz finder launch broadcast.

```js
const EXTRAFUN_FINDER_ANNOUNCE = `Cześć! 🖤
Uruchamiamy Szukaj na ExtraFun — możesz przeglądać profile i pisać do innych.
Twój profil (nick, zdjęcie, „szukam") będzie widoczny także tutaj. Jeśli wolisz nie —
wejdź w Profil → „Ukryj mnie w Szukaj na extrafun" i znikasz z listy. W każdej chwili wrócisz.`;

app.post('/api/admin/finder/broadcast', verifyJWT, isAdmin, async (_req, res) => {
  try {
    // Idempotency: an atomic insert of a marker row wins the race. If the row
    // already exists the insert errors (unique key) → already sent, bail with 409.
    const { error: markerErr } = await supabaseAdmin.from('site_config')
      .insert({ key: 'extrafun_finder_broadcast_sent', value: new Date().toISOString() });
    if (markerErr) return res.status(409).json({ message: 'Zapowiedź już wysłana', alreadySent: true });

    const ids = [];
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      for (const u of data.users) ids.push(u.id);
      if (data.users.length < 200) break;
    }
    const rows = ids.map(id => ({
      sender_id: null, sender_name: 'ExtraFun',
      recipient_id: id, recipient_name: '',
      content: EXTRAFUN_FINDER_ANNOUNCE, is_read: false,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      await supabaseAdmin.from('private_messages').insert(rows.slice(i, i + 500));
    }
    // Marker already inserted at the top (idempotency guard) — nothing else to write.
    res.json({ sent: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

- [ ] **Step 2: Verify the DM sender shape matches `private_messages`**

Before shipping, confirm the `private_messages` columns and whether `sender_id` can be null (the biz broadcast uses a dedicated Jessica sender id). If null is not allowed, use a system sender id constant. Run (Supabase MCP):
`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='private_messages';`
Adjust `sender_id`/`sender_name` accordingly before Step 3.

- [ ] **Step 3: Flip the gate**

Set `FINDER_LIVE = true` in `morefun/server/routes.js`.

- [ ] **Step 4: Commit + deploy**

```bash
git add server/routes.js
git commit -m "feat(finder): heads-up broadcast + go live (FINDER_LIVE=true)"
git push origin main
```

- [ ] **Step 5: Run the broadcast ONCE (admin), then verify**

As admin: `POST /api/admin/finder/broadcast` → `{sent:<n>}`. A second call → 409 `alreadySent`. Then verify a logged-in `GET /api/finder` returns `items` (no longer locked) and honors `hidden_from_extrafun`.

### Task 9: Soft-remove the discovery grid from biz

**Files:**
- Modify: `bizarriusz/client/src/layout/BizLayout.tsx:70-79` (remove the `/szukaj` nav item)
- Modify: `bizarriusz/client/src/App.tsx:86` (remove or guard the `/szukaj` route)

- [ ] **Step 1: Remove the Szukaj nav entry**

Delete the nav object at `BizLayout.tsx:70-79` (the `href: "/szukaj"` block). Leave `/profil/:id` and likes wiring intact.

- [ ] **Step 2: Remove the grid route**

In `bizarriusz/client/src/App.tsx`, remove the `<Route path="/szukaj" component={Szukaj} />` line (86) and the `Szukaj` import (10). Keep the profile-detail route (`/profil/:id`) and any likes/"kto Cię polubił" surface so a liked/DMed user's profile is still reachable on biz.

- [ ] **Step 3: Verify profile-detail still reachable on biz**

Confirm `/profil/:id` still renders (reached from a like notification `/profil/<likerId>`). The biz `GET /api/finder` listing endpoint is now unreferenced by the UI but left in place (harmless).

- [ ] **Step 4: tsc + commit + deploy (biz repo)**

```bash
cd ../bizarriusz
npx tsc --noEmit   # expect EXIT 0
git add client/src/layout/BizLayout.tsx client/src/App.tsx
git commit -m "feat(finder): remove discovery grid from biz — catalog now on extrafun"
git push origin main
```

- [ ] **Step 5: Verify on biz prod**

`Szukaj` tab gone from nav; `/profil/<id>` still loads; chat/RSVP/groups unaffected.

---

## Self-Review

- **Spec coverage:** consent model (Task 3 flag + Task 8 broadcast + Task 7 toggle) ✓; biz soft-removal (Task 9) ✓; lean extrafun finder no biz-groups/checkin/ads (Tasks 1,2) ✓; likes/match/block/report (Tasks 5,6,7) ✓; phasing 1→2→3 ✓; guest count-only gate (FINDER_LIVE) ✓; shared tables reused ✓.
- **Known adaptation:** no push on extrafun like (VAPID not configured) — spec's "push to liked user" is intentionally dropped for v1; match surfaces via "who liked me".
- **Verify-before-ship:** Task 8 Step 2 checks `private_messages` nullability + Task 3/8 assume `user_gallery(image_url,user_id,created_at)` and `profile_*` snake_case columns — the executing agent must confirm exact column names against the shared DB (Supabase MCP `list_tables`) before running each write. This is called out rather than assumed.

## Open items for the executor
- Confirm shared-table column names via Supabase MCP `list_tables` before Tasks 1/5/6/8 (snake_case assumed: `profile_likes.liker_id/liked_id`, `profile_blocks.blocker_id/blocked_id`, `profile_reports.reporter_id/reported_id`, `user_gallery.user_id/image_url/created_at`, `site_config.key/value`).
- Confirm the extrafun own-profile edit page path for Task 7 Step 2 (where `avatar_url`/`about`/`looking_for` are set) — the visibility toggle lives there.
- Task 8 idempotency relies on `site_config.key` having a PRIMARY KEY / UNIQUE constraint so a second insert errors. Confirm it exists; if not, add it before running the broadcast. Caveat: marker-first means a mid-send failure leaves the marker set — to retry, delete the `extrafun_finder_broadcast_sent` row (matches the biz broadcast tradeoff).
