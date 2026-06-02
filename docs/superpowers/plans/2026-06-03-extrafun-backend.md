# ExtraFun Backend Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all DB access in ExtraFun from the browser (Supabase anon key) behind an Express backend with a service-role key, add server-generated SEO (sitemap, robots, per-article meta injection), and fix the white screen — without changing the existing UI.

**Architecture:** Extend the existing `server.js` into a `server/` directory: a service-role Supabase client, a JWT-verify middleware, an `/api/*` router, and a meta-injection layer. The React client keeps Supabase-JS for auth only; every `supabase.from(...)` data call becomes `apiFetch('/api/...')`.

**Tech Stack:** Node + Express, `@supabase/supabase-js` (server: service-role; client: auth only), Vite + React (wouter), Railway.

**No test runner exists** in this repo (matches gay.pl/bizarriusz). Verification is by `curl`, `vite build`, and manual page checks — not unit tests.

---

## File Structure

Create:
- `server/index.js` — Express bootstrap (replaces root `server.js` logic)
- `server/supabase.js` — service-role client
- `server/auth.js` — `verifyJWT`, `isAdmin`
- `server/routes.js` — `/api/*` + `/sitemap.xml` + `/robots.txt`
- `server/meta.js` — per-article HTML meta injection
- `src/lib/api.js` — client `apiFetch(path, opts)` helper (attaches bearer token)

Modify:
- `package.json` — `start` script → `node server/index.js`
- `src/lib/supabase.js` — keep (auth only); stop using for data
- `src/App.jsx` — page_views insert → `apiFetch('/api/track')`
- `src/hooks/useAuth.jsx` — profile upsert → `apiFetch('/api/profile', PUT)`
- `src/pages/Magazyn.jsx` — articles list → `/api/articles`
- `src/pages/ArticleDetailPage.jsx` — article by slug + view → `/api/articles/:slug`
- `src/pages/Ogloszenia.jsx` — `classifieds` → `/api/ads`
- `src/pages/Czat.jsx` — rewrite to shared shoutbox via `/api/shoutbox`
- `src/pages/Admin.jsx` — articles + ads moderation + page_views stats → `/api/admin/*`

Unchanged (static, stay client-side): `src/pages/Przewodnik.jsx` (Miejsca),
`src/lib/dictionary.js` (słówko dnia), `src/lib/quiz.js`, `src/lib/articles.js`
(fallback). Remove `Forum` from nav (mockup).

Env (Railway service `4cc080de-...`): add `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_EMAIL=pinksservice@gmail.com`. `SUPABASE_URL` already implied by the
hardcoded value — set it explicitly too.

---

## Task 1: Backend scaffolding (server dir, supabase client, auth)

**Files:**
- Create: `server/supabase.js`, `server/auth.js`, `server/index.js`
- Modify: `package.json` (start script)

- [ ] **Step 1: Service-role client**

Create `server/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'https://lvxaycjuhchoqhnttyjj.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) console.error('[server] SUPABASE_SERVICE_ROLE_KEY missing — API will fail')

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

- [ ] **Step 2: Auth middleware**

Create `server/auth.js`:

```js
import { supabaseAdmin } from './supabase.js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || 'pinksservice@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function verifyJWT(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = { id: user.id, email: user.email, meta: user.user_metadata }
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

// optional: attach req.user if a valid token is present, never block
export async function optionalAuth(req, _res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (token) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) req.user = { id: user.id, email: user.email, meta: user.user_metadata }
    } catch { /* anonymous */ }
  }
  next()
}

export function isAdmin(req, res, next) {
  if (!isAdminEmail(req.user?.email)) return res.status(403).json({ message: 'Brak dostępu' })
  next()
}
```

- [ ] **Step 3: Express bootstrap (replaces server.js)**

Create `server/index.js`:

```js
import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { registerRoutes } from './routes.js'
import { sendArticleHtml } from './meta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Domain redirect (.fun/.club → .pl) — preserved from old server.js
app.use((req, res, next) => {
  const host = req.hostname || ''
  if (host.includes('extrafun.fun') || host.includes('extrafun.club')) {
    return res.redirect(301, `https://extrafun.pl${req.originalUrl}`)
  }
  next()
})

registerRoutes(app)

// Per-article meta injection for crawlers (before static/SPA fallback)
app.get('/magazyn/:slug', (req, res) => sendArticleHtml(req, res, DIST))

app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(join(DIST, 'index.html')))

app.listen(PORT, () => console.log(`ExtraFun server on ${PORT}`))
```

- [ ] **Step 4: Update start script**

In `package.json`, change `"start": "node server.js"` to `"start": "node server/index.js"`.
Keep old `server.js` for now (delete in Task 8).

- [ ] **Step 5: Stub routes + meta so it boots**

Create `server/routes.js`:

```js
export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }))
}
```

Create `server/meta.js`:

```js
import { readFileSync } from 'fs'
import { join } from 'path'
export function sendArticleHtml(_req, res, dist) {
  res.sendFile(join(dist, 'index.html'))
}
```

- [ ] **Step 6: Verify boot**

Run: `cd C:/Users/lenovo/Downloads/morefun && npm run build && SUPABASE_SERVICE_ROLE_KEY=test node server/index.js &` then `curl -s localhost:3000/api/health`
Expected: `{"ok":true}`. Kill the server after.

- [ ] **Step 7: Commit**

```bash
git add server/ package.json
git commit -m "feat(extrafun): backend scaffolding (express, service-role, auth)"
```

---

## Task 2: Articles API + Magazyn/ArticleDetail client swap

**Files:**
- Modify: `server/routes.js`, `src/lib/api.js` (create), `src/pages/Magazyn.jsx`, `src/pages/ArticleDetailPage.jsx`

- [ ] **Step 1: Client api helper**

Create `src/lib/api.js`:

```js
import { supabase } from './supabase'

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.status === 204 ? null : res.json()
}
```

- [ ] **Step 2: Articles endpoints**

In `server/routes.js`, add inside `registerRoutes` (import at top:
`import { supabaseAdmin } from './supabase.js'`):

```js
  // Magazyn list — published extrafun articles
  app.get('/api/articles', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, cover_image, category_slug, featured, publish_date')
      .eq('site', 'extrafun').eq('status', 'published')
      .order('publish_date', { ascending: false, nullsFirst: false })
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  // Single article by slug (+ fire-and-forget view increment)
  app.get('/api/articles/:slug', async (req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, content, category_slug, cover_image, featured, seo_title, seo_description')
      .eq('site', 'extrafun').eq('status', 'published').eq('slug', req.params.slug)
      .maybeSingle()
    if (error) return res.status(500).json({ message: error.message })
    if (!data) return res.status(404).json({ message: 'Not found' })
    supabaseAdmin.rpc('increment_article_views', { article_id: data.id }).then(() => {}, () => {})
    res.json(data)
  })
```

- [ ] **Step 3: Magazyn client swap**

In `src/pages/Magazyn.jsx`: replace the `supabase.from('articles')...` effect (around line 109) with:

```js
  useEffect(() => {
    apiFetch('/api/articles')
      .then(rows => { if (rows?.length) setArticles(rows) })
      .catch(() => { /* keep FALLBACK_ARTICLES */ })
  }, [])
```

Add `import { apiFetch } from '../lib/api'` and remove the now-unused
`import { supabase } from '../lib/supabase'` if no other use remains.

- [ ] **Step 4: ArticleDetail client swap**

In `src/pages/ArticleDetailPage.jsx`: replace the `supabase.from('articles')...eq('slug', slug)` block (≈ line 56-68) with:

```js
    apiFetch(`/api/articles/${slug}`)
      .then(data => setArticle({
        id: data.id, title: data.title, slug: data.slug,
        excerpt: data.excerpt, content: data.content,
        category: SLUG_TO_DISPLAY[data.category_slug] || data.category_slug || 'CNM 101',
        coverImage: data.cover_image, seoTitle: data.seo_title, seoDescription: data.seo_description,
      }))
      .catch(() => {
        const found = ARTICLES.find(a => a.slug === slug)
        if (found) setArticle(found)
      })
```

Remove the client-side `supabase.rpc('increment_article_views', ...)` call (now
server-side). Add `import { apiFetch } from '../lib/api'`.

- [ ] **Step 5: Build + curl verify**

Run: `npm run build && SUPABASE_SERVICE_ROLE_KEY=<key> node server/index.js &`
then `curl -s localhost:3000/api/articles | head -c 300` and
`curl -s localhost:3000/api/articles/cnm-101-co-to-jest | head -c 200`
Expected: JSON array of articles; single article object (or 404 if slug absent).

- [ ] **Step 6: Commit**

```bash
git add server/routes.js src/lib/api.js src/pages/Magazyn.jsx src/pages/ArticleDetailPage.jsx
git commit -m "feat(extrafun): articles via backend API"
```

---

## Task 3: page_views tracking + profile via API

**Files:**
- Modify: `server/routes.js`, `src/App.jsx`, `src/hooks/useAuth.jsx`

- [ ] **Step 1: Endpoints**

Add to `server/routes.js` (import `optionalAuth`, `verifyJWT` from `./auth.js`):

```js
  // Analytics — anonymous page view
  app.post('/api/track', async (req, res) => {
    const { path, referrer, device, sessionId } = req.body || {}
    if (!path) return res.status(400).json({ message: 'path required' })
    await supabaseAdmin.from('page_views').insert({
      site: 'extrafun', path, referrer: referrer || null,
      device: device || null, session_id: sessionId || null,
    })
    res.json({ ok: true })
  })

  // Own profile upsert (called after signup/login)
  app.put('/api/profile', verifyJWT, async (req, res) => {
    const { username, display_name, avatar_url, bio, city } = req.body || {}
    const { error } = await supabaseAdmin.from('profiles').upsert({
      id: req.user.id, username, display_name, avatar_url, bio, city,
    })
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })
```

- [ ] **Step 2: App.jsx tracking swap**

In `src/App.jsx` replace the `supabase.from('page_views').insert({...})` block
(≈ line 215) with:

```js
      apiFetch('/api/track', { method: 'POST', body: {
        path: location,
        referrer: document.referrer || null,
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        sessionId: getSessionId(),
      }}).catch(() => {})
```

Reuse the page's existing session-id source for `getSessionId()` (or inline the
existing logic that was passed to the old insert). Add `import { apiFetch } from './lib/api'`.

- [ ] **Step 3: useAuth profile swap**

In `src/hooks/useAuth.jsx` replace `await supabase.from('profiles').upsert({...})`
(≈ line 58) with:

```js
      await apiFetch('/api/profile', { method: 'PUT', body: { username, display_name: username } }).catch(() => {})
```

Match the field names the old upsert used. Add `import { apiFetch } from '../lib/api'`.
Keep `supabase.auth.signUp/signInWithPassword/getSession/signOut` untouched.

- [ ] **Step 4: Build + verify**

Run: `npm run build` (must pass). Then with server running:
`curl -s -X POST localhost:3000/api/track -H 'Content-Type: application/json' -d '{"path":"/"}'`
Expected: `{"ok":true}`.

- [ ] **Step 5: Commit**

```bash
git add server/routes.js src/App.jsx src/hooks/useAuth.jsx
git commit -m "feat(extrafun): page_views + profile via API"
```

---

## Task 4: Shared chat (shoutbox) — rewrite Czat

**Files:**
- Modify: `server/routes.js`, `src/pages/Czat.jsx`

Czat currently uses the `messages`/`conversations` DM tables. v1 replaces it with
the shared live chat stream (`shoutbox_messages`, same as bizarriusz.pl/czat) so
the feed is populated.

- [ ] **Step 1: Endpoints**

Add to `server/routes.js`:

```js
  // Shared live chat — same stream as bizarriusz.pl/czat
  app.get('/api/shoutbox', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .select('*').eq('source', 'bizarriusz')
      .order('created_at', { ascending: false }).limit(limit)
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).reverse())
  })

  app.post('/api/shoutbox', verifyJWT, async (req, res) => {
    const content = (req.body?.content || '').trim()
    if (!content || content.length > 500) return res.status(400).json({ message: 'Invalid content' })
    const meta = req.user.meta || {}
    const username = meta.display_name || meta.full_name || meta.name || 'Gość'
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .insert({ user_id: req.user.id, username, content, source: 'bizarriusz' })
      .select().single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })
```

> Note: `source: 'bizarriusz'` makes ExtraFun and bizarriusz share one feed.
> Confirmed by user (czat = bizarriusz.pl/czat). To split later, change to `'extrafun'`.

- [ ] **Step 2: Rewrite Czat.jsx**

Replace the DM logic in `src/pages/Czat.jsx` with a single shared feed: poll
`apiFetch('/api/shoutbox')` every 6000 ms, render messages (username + content +
time), and a composer that calls `apiFetch('/api/shoutbox', { method:'POST', body:{ content }})`
when logged in (else prompt to log in). Keep the existing page chrome/styling.
Remove `supabase.from('messages')` / `conversations` usage.

```js
// core of Czat.jsx
import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'

export function Czat({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  const load = () => apiFetch('/api/shoutbox').then(setMessages).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || !user) return
    setInput('')
    try { await apiFetch('/api/shoutbox', { method: 'POST', body: { content } }); load() } catch {}
  }
  // ...render messages list + input (reuse existing styles)
}
```

- [ ] **Step 3: Build + verify**

Run: `npm run build` (pass). With server running:
`curl -s localhost:3000/api/shoutbox | head -c 300`
Expected: JSON array of recent bizarriusz chat messages.

- [ ] **Step 4: Commit**

```bash
git add server/routes.js src/pages/Czat.jsx
git commit -m "feat(extrafun): shared live chat via shoutbox API"
```

---

## Task 5: Ogłoszenia — switch classifieds → shared ads

**Files:**
- Modify: `server/routes.js`, `src/pages/Ogloszenia.jsx`

- [ ] **Step 1: Endpoints**

Add to `server/routes.js`:

```js
  app.get('/api/ads', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('ads')
      .select('*').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(100)
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  app.post('/api/ads', verifyJWT, async (req, res) => {
    const { title, description, category, location, contactInfo } = req.body || {}
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ message: 'Brak danych' })
    const { data, error } = await supabaseAdmin.from('ads').insert({
      title: title.trim(), description: description.trim(),
      category: category || 'inne', location: location || null,
      contact_info: contactInfo || null, status: 'active', source: 'extrafun',
      author_uuid: req.user.id,
    }).select().single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })
```

- [ ] **Step 2: Ogloszenia.jsx swap**

Replace the `supabase.from('classifieds').select('*').order('created_at', ...)`
read (≈ line 84) with `apiFetch('/api/ads')`, and the
`supabase.from('classifieds').insert({...})` (≈ line 103) with
`apiFetch('/api/ads', { method:'POST', body:{ title, description, category, location, contactInfo } })`.
Map any classifieds field names to the `ads` columns (`contact_info`, `description`).
Add `import { apiFetch } from '../lib/api'`.

- [ ] **Step 3: Build + verify**

Run: `npm run build` then `curl -s localhost:3000/api/ads | head -c 200`
Expected: JSON array (shared active ads).

- [ ] **Step 4: Commit**

```bash
git add server/routes.js src/pages/Ogloszenia.jsx
git commit -m "feat(extrafun): ogloszenia on shared ads table via API"
```

---

## Task 6: Admin API + Admin.jsx swap

**Files:**
- Modify: `server/routes.js`, `src/pages/Admin.jsx`

- [ ] **Step 1: Admin endpoints**

Add to `server/routes.js` (import `isAdmin`):

```js
  // Admin: all extrafun articles (any status)
  app.get('/api/admin/articles', verifyJWT, isAdmin, async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('*').eq('site', 'extrafun').order('publish_date', { ascending: false, nullsFirst: false })
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  app.post('/api/admin/articles', verifyJWT, isAdmin, async (req, res) => {
    const payload = { ...req.body, site: 'extrafun' }
    const { data, error } = await supabaseAdmin.from('articles').insert(payload).select().single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })

  app.put('/api/admin/articles/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('articles').update(req.body).eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  app.delete('/api/admin/articles/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('articles').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.status(204).end()
  })

  // Admin: page_views stats (raw rows, last 30 days)
  app.get('/api/admin/page-views', verifyJWT, isAdmin, async (_req, res) => {
    const since = new Date(Date.now() - 30 * 864e5).toISOString()
    const { data, error } = await supabaseAdmin.from('page_views')
      .select('*').eq('site', 'extrafun').gte('created_at', since)
      .order('created_at', { ascending: false }).limit(5000)
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  // Admin: ads moderation
  app.delete('/api/admin/ads/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('ads').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.status(204).end()
  })
  app.put('/api/admin/ads/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('ads').update(req.body).eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })
```

- [ ] **Step 2: Admin.jsx swap**

In `src/pages/Admin.jsx` replace each `supabase.from(...)` data call with the
matching `apiFetch`:
- articles read (≈187) → `apiFetch('/api/admin/articles')`
- article update (≈217) → `apiFetch(`/api/admin/articles/${mode.id}`, { method:'PUT', body: payload })`
- article insert (≈219) → `apiFetch('/api/admin/articles', { method:'POST', body: payload })`
- article delete (≈230) → `apiFetch(`/api/admin/articles/${id}`, { method:'DELETE' })`
- article publish toggle (≈236) → `apiFetch(`/api/admin/articles/${article.id}`, { method:'PUT', body:{ status: newStatus } })`
- page_views read (≈307) → `apiFetch('/api/admin/page-views')`
- ads read (≈396) → `apiFetch('/api/ads')`
- ads delete (≈409) → `apiFetch(`/api/admin/ads/${id}`, { method:'DELETE' })`
- ads status update (≈415) → `apiFetch(`/api/admin/ads/${ad.id}`, { method:'PUT', body:{ status: newStatus } })`

Add `import { apiFetch } from '../lib/api'`. Keep the `user.email === ADMIN_EMAIL`
client gate (the server re-checks via `isAdmin`).

- [ ] **Step 3: Build verify**

Run: `npm run build` — must pass with no unresolved imports.

- [ ] **Step 4: Commit**

```bash
git add server/routes.js src/pages/Admin.jsx
git commit -m "feat(extrafun): admin operations via authorized API"
```

---

## Task 7: SEO — sitemap, robots, per-article meta injection

**Files:**
- Modify: `server/routes.js`, `server/meta.js`

- [ ] **Step 1: sitemap + robots**

Add to `server/routes.js`:

```js
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /profil

Sitemap: https://extrafun.pl/sitemap.xml`)
  })

  app.get('/sitemap.xml', async (_req, res) => {
    const { data } = await supabaseAdmin.from('articles')
      .select('slug, publish_date').eq('site', 'extrafun').eq('status', 'published')
    const staticUrls = [
      { loc: 'https://extrafun.pl/', priority: '1.0' },
      { loc: 'https://extrafun.pl/magazyn', priority: '0.9' },
      { loc: 'https://extrafun.pl/miejsca', priority: '0.7' },
      { loc: 'https://extrafun.pl/czat', priority: '0.5' },
      { loc: 'https://extrafun.pl/ogloszenia', priority: '0.6' },
    ]
    const articleUrls = (data || []).map(a => ({
      loc: `https://extrafun.pl/magazyn/${a.slug}`, priority: '0.8',
      lastmod: a.publish_date ? new Date(a.publish_date).toISOString().slice(0, 10) : undefined,
    }))
    const urls = [...staticUrls, ...articleUrls]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
    res.type('application/xml').send(xml)
  })
```

- [ ] **Step 2: Meta injection**

Replace `server/meta.js` with:

```js
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase.js'

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function sendArticleHtml(req, res, dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const { data } = await supabaseAdmin.from('articles')
      .select('title, excerpt, slug, cover_image, seo_title, seo_description')
      .eq('site', 'extrafun').eq('status', 'published').eq('slug', req.params.slug)
      .maybeSingle()
    if (!data) return res.send(html)
    const title = esc(data.seo_title || `${data.title} | ExtraFun`)
    const desc = esc(data.seo_description || data.excerpt || '')
    const url = `https://extrafun.pl/magazyn/${data.slug}`
    const img = data.cover_image ? esc(data.cover_image) : 'https://extrafun.pl/og-default.jpg'
    const tags = `<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />`
    // Replace the first <title>...</title> and inject OG before </head>
    const injected = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace('</head>', `${tags}\n</head>`)
    res.send(injected)
  } catch {
    res.send(html)
  }
}
```

- [ ] **Step 3: Build + verify**

Run: `npm run build` then with server running:
`curl -s localhost:3000/sitemap.xml | head -c 300`,
`curl -s localhost:3000/robots.txt`,
`curl -s localhost:3000/magazyn/cnm-101-co-to-jest | grep -o '<meta property="og:title[^>]*>'`
Expected: valid sitemap XML; robots text; an injected og:title with the article title.

- [ ] **Step 4: Commit**

```bash
git add server/routes.js server/meta.js
git commit -m "feat(extrafun): server sitemap, robots, per-article meta injection"
```

---

## Task 8: Cleanup — remove Forum from nav, delete old server.js, drop dead supabase data calls

**Files:**
- Modify: `src/App.jsx` (nav + routes), delete `server.js`
- Modify: `src/lib/supabase.js` (comment that it is auth-only)

- [ ] **Step 1: Remove Forum route + nav link**

In `src/App.jsx` remove the `<Route path="/forum">` line and any Forum nav entry
in the top/bottom nav. Leave `src/pages/Forum.jsx` on disk (unused) — do not wire it.

- [ ] **Step 2: Delete old server.js**

```bash
git rm server.js
```

(Its logic now lives in `server/index.js`.)

- [ ] **Step 3: Mark supabase.js auth-only**

Add a comment at the top of `src/lib/supabase.js`:
`// Client Supabase: AUTH ONLY (signin/signup/session). All data goes through /api/* (see lib/api.js).`

- [ ] **Step 4: Grep for stragglers**

Run: `grep -rn "supabase.from\|supabase.rpc" src/` —
Expected: no matches in `src/pages` or `src/App.jsx` or `src/hooks` except auth.
(`supabase.auth.*` is allowed.) Fix any remaining data call by routing it through `apiFetch`.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add -A
git commit -m "chore(extrafun): drop Forum from nav, remove old server.js, data via API only"
```

---

## Task 9: Railway env + deploy + verify (incl. white-screen)

**Files:** none (ops)

- [ ] **Step 1: Set env on Railway service `4cc080de-ea1d-4b32-9ee2-80bb42389146`**

Via Railway dashboard (or API) set, on project `96ebf1b4-...` env `25178b1f-...`:
- `SUPABASE_URL = https://lvxaycjuhchoqhnttyjj.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY = <service role key from Supabase settings>`
- `ADMIN_EMAIL = pinksservice@gmail.com`

(Do NOT commit the service-role key. The user sets it in the dashboard.)

- [ ] **Step 2: Push + deploy**

```bash
git push origin HEAD
```
Then deploy via Railway `serviceInstanceDeployV2(serviceId, environmentId, commitSha)`.

- [ ] **Step 3: Verify live**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://extrafun.pl/api/health   # 200 {"ok":true}
curl -s https://extrafun.pl/api/articles | head -c 200                    # JSON
curl -s https://extrafun.pl/sitemap.xml | head -c 200                     # XML
curl -s https://extrafun.pl/magazyn/<real-slug> | grep -o '<title>[^<]*'  # injected title
```
Open https://extrafun.pl in a browser: Magazyn, Miejsca, Czat (shows shared
messages), Ogłoszenia, login, admin all render — **white screen gone**.

- [ ] **Step 4: Confirm root cause of white screen**

If the white screen persists, capture the browser console error (it is now a
known-good code path; a remaining blank means a client bundle/runtime error —
fix that specific error, do not mask it). Record the cause in the commit message.

- [ ] **Step 5: Final commit (if fixes needed)**

```bash
git add -A && git commit -m "fix(extrafun): <root cause of white screen>"
```

---

## Self-Review notes
- Spec coverage: Magazyn (T2), Miejsca (static, untouched), Czat shared (T4),
  Ogłoszenia shared ads (T5), auth (T1/T3), admin CRUD (T6), sitemap/robots/meta
  (T7), white-screen (T9). All spec sections mapped.
- Static-but-claimed-DB items (Miejsca, słownik, quiz) intentionally left
  client-side — they are not DB-backed; no API needed.
- Field-name caution: `ads` uses `contact_info`/`description`/`author_uuid`;
  `articles` uses `category_slug`/`publish_date`/`cover_image`/`seo_*`. Mirror
  the existing column names exactly when wiring the client.
- Service-role key only imported by `server/supabase.js`; never reaches the bundle.
