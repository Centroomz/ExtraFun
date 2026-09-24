import { supabaseAdmin } from './supabase.js'
import { verifyJWT, optionalAuth, isAdmin, isAdminEmail } from './auth.js'
import { isFemaleNick, isTabooContent } from './chat-gender.js'

// --- FINDER (member catalog) -------------------------------------------------
// Profiles live in Supabase auth user_metadata (shared across portals). Project
// ONLY safe public fields — never email. Excludes hidden_from_search (biz opt-out)
// AND hidden_from_extrafun (this portal's opt-out). Gated OFF (count-only) until
// the consent DM goes out — see the broadcast endpoint / Phase 3.
const FINDER_LIVE = true; // Phase 3: live — see POST /api/admin/finder/broadcast for the heads-up DM
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
      if (!name) continue;                           // only filled profiles
      if (m.hidden_from_search === true) continue;   // biz opt-out
      if (m.hidden_from_extrafun === true) continue;  // extrafun opt-out
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
  // Gallery: pull the whole table rather than `.in(id, <890 ids>)` — that IN
  // list would blow past the URL query-string limit. user_gallery is bounded
  // by actual photo count, not visible-profile count, so this is the smaller read.
  const { data: g } = await supabaseAdmin.from('user_gallery')
    .select('user_id, image_url, created_at')
    .order('created_at', { ascending: false });
  const firstPhoto = new Map();
  const galleryIds = new Set();
  for (const row of (g || [])) {
    galleryIds.add(row.user_id);
    if (!firstPhoto.has(row.user_id)) firstPhoto.set(row.user_id, row.image_url);
  }
  for (const p of rows) {
    p.hasGallery = galleryIds.has(p.id);
    if (!p.avatarUrl && firstPhoto.has(p.id)) p.avatarUrl = firstPhoto.get(p.id);
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

export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // === MIEJSCA (swingers venues directory) ===
  app.get('/api/places', async (_req, res) => {
    // Reads from the merged `venues` table (staging). Swing rows were copied
    // there with legacy_swing_id = original swingers_venues.id; the 4 duplicates
    // (Bizarriusz/Heaven/Galla/Berlin) live as native venues rows with swing_days
    // set. Events stay keyed by the swingers-space id, so we look them up by
    // legacy_swing_id (copied) or id (native). gay.pl is unaffected: these rows
    // are is_active=false + gay_days='{}'. No DB mutation — revert = swap table back.
    const { data: venues, error } = await supabaseAdmin.from('venues')
      .select('id, name, type, address, city, description, website, lat, lng, cover_image, scene, gay_days, swing_days, legacy_swing_id')
      .or('legacy_swing_id.not.is.null,swing_days.not.is.null,type.eq.plaża')
      .order('city', { ascending: true })
    if (error) return res.status(500).json({ message: error.message })
    // Attach the weekly schedule (recurring_events) to each venue.
    const { data: events } = await supabaseAdmin.from('recurring_events')
      .select('id, venue_id, day_of_week, event_name, description, start_time, end_time, price, tags')
      .or('is_active.is.null,is_active.eq.true')
      .order('day_of_week', { ascending: true })
    const byVenue = {}
    for (const e of (events || [])) (byVenue[e.venue_id] ||= []).push(e)
    // Dated specials (one-off events) that override the weekly schedule on a day.
    const todayStr = new Date().toISOString().slice(0, 10)
    const { data: oneTime } = await supabaseAdmin.from('one_time_events')
      .select('id, venue_id, event_date, event_name, description, start_time, end_time, price, external_link')
      .gte('event_date', todayStr)
      .order('event_date', { ascending: true })
    const otByVenue = {}
    for (const e of (oneTime || [])) (otByVenue[e.venue_id] ||= []).push(e)
    // Audience-by-day: on extrafun (swing) show a venue's events only on its swing
    // days; label each (a day also in gay_days = mixed crowd). NULL swing_days =
    // unset → behave as before (show all). getDay 0=Sun..6=Sat.
    const out = (venues || []).map(v => {
      const sd = v.swing_days, gd = v.gay_days
      const unset = !sd || sd.length === 0   // empty array [] = unset, same as NULL (else [].includes()=false hides every day — bug hit Bizarriusz v5)
      const allow = (dow) => unset || sd.includes(dow)
      const label = (dow) => unset ? null : (gd && gd.includes(dow) ? 'Panie i Panowie' : 'Pary i single')
      const key = v.id   // events re-keyed to own venues.id (migration 2026-07-08); legacy_swing_id no longer used for lookup — avoids ID collision with gay.pl venues
      const events = (byVenue[key] || []).filter(e => allow(e.day_of_week)).map(e => ({ ...e, audience: label(e.day_of_week) }))
      // Alias venues columns back to the swingers shape the frontend expects.
      return { ...v, latitude: v.lat, longitude: v.lng, logo_url: v.cover_image, events, oneTime: otByVenue[key] || [] }
    })
    res.set('Cache-Control', 'public, max-age=60')
    res.json(out)
  })

  // === ANALYTICS ===
const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|python-|urllib|curl\/|wget|scrapy|http-?client|go-http|java\/|node-fetch|axios\/|okhttp|bytespider|gptbot|claudebot|ccbot|perplexity|amazonbot|dataforseo|semrush|ahrefs|dotbot|mj12|petalbot|yandex|bingpreview|facebookexternalhit|meta-externalagent/i

  app.post('/api/track', async (req, res) => {
    const { path, referrer, device, sessionId, utmSource, utmMedium } = req.body || {}
    if (!path) return res.status(400).json({ message: 'path required' })
    // Flag bots by user-agent — don't block, just mark, so dashboards split real vs
    // bot (a headless-crawler burst like 2026-07-17 shouldn't read as growth). Empty
    // UA = flagged; real browsers always send one.
    const ua = String(req.headers['user-agent'] || '')
    const isBot = ua === '' || BOT_UA.test(ua)
    await supabaseAdmin.from('page_views').insert({
      site: 'extrafun', path: String(path).slice(0, 200),
      referrer: referrer ? String(referrer).slice(0, 100) : null,
      device: device || null, session_id: sessionId ? String(sessionId).slice(0, 40) : null,
      utm_source: utmSource ? String(utmSource).slice(0, 100) : null,
      utm_medium: utmMedium ? String(utmMedium).slice(0, 100) : null,
      user_agent: ua ? ua.slice(0, 300) : null,
      is_bot: isBot,
    }).then(() => {}, () => {})
    res.json({ ok: true })
  })

  // Card impressions/clicks (article / venue / ad tiles). Aggregated per day in
  // card_stats via bump_card_stat — no IP, no user id. Sent as a beacon batch.
  app.post('/api/card-stats', async (req, res) => {
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 40) : []
    const ua = String(req.headers['user-agent'] || '')
    if (!events.length || ua === '' || BOT_UA.test(ua)) return res.json({ ok: true })
    const KINDS = new Set(['article', 'venue', 'ad'])
    await Promise.all(events
      .filter(e => e && KINDS.has(e.kind) && (e.ev === 'imp' || e.ev === 'click') && e.id != null)
      .map(e => supabaseAdmin.rpc('bump_card_stat', { p_kind: e.kind, p_ref: String(e.id).slice(0, 64), p_ev: e.ev })
        .then(() => {}, () => {})))
    res.json({ ok: true })
  })

  // === PROFILE (own) ===
  app.put('/api/profile', verifyJWT, async (req, res) => {
    const { username, display_name } = req.body || {}
    const { error } = await supabaseAdmin.from('profiles').upsert({
      user_id: req.user.id,
      username: username || null,
      display_name: display_name || username || null,
    }, { onConflict: 'user_id' })
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  // === SELF-SERVICE: usuń własne konto (RODO, prawo do bycia zapomnianym) ===
  // Kasuje dane usera na WSZYSTKICH 3 portalach (wspólna baza) przez RPC
  // delete_user_account, potem sam auth user. Hard delete, nieodwracalne.
  app.delete('/api/account', verifyJWT, async (req, res) => {
    try {
      const userId = req.user.id
      const { error: rpcError } = await supabaseAdmin.rpc('delete_user_account', { p_user_id: userId })
      if (rpcError) throw rpcError
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) throw authError
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  // === ARTICLES (Magazyn) ===

  // Published extrafun articles — list for Magazyn
  app.get('/api/articles', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, content, category_slug, cover_image, featured, author, tags, publish_date, created_at, views')
      .eq('site', 'extrafun').eq('status', 'published')
      // publish_date is the editorial date; created_at is bulk-import time
      // (whole June batch shares one timestamp), so sort by publish_date first.
      .order('publish_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ message: error.message })
    // The list never renders full bodies — it only needs a reading time and the
    // first paragraph (mobile tiles). Shipping every `content` made this 158 kB
    // raw; the preview + precomputed reading_time cut that by ~85%.
    const list = (data || []).map(({ content, ...rest }) => ({
      ...rest,
      reading_time: Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200)),
      content_preview: (content || '').slice(0, 900),
    }))
    res.set('Cache-Control', 'public, max-age=60')
    res.json(list)
  })

  // Single article by slug (+ fire-and-forget view increment)
  app.get('/api/articles/:slug', async (req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, content, category_slug, cover_image, cover_video, featured, seo_title, seo_description, author, tags, publish_date, created_at, views')
      .eq('site', 'extrafun').eq('status', 'published').eq('slug', req.params.slug)
      .maybeSingle()
    if (error) return res.status(500).json({ message: error.message })
    if (!data) return res.status(404).json({ message: 'Not found' })
    supabaseAdmin.rpc('increment_article_views', { article_id: data.id }).then(() => {}, () => {})
    res.json(data)
  })

  // === AKTUALNOŚCI (news) ===
  // Items are ingested by the gay.pl server's news fetcher (single shared workflow)
  // and tagged site='extrafun'. Here we only read the extrafun slice.
  app.get('/api/news', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('news_items')
      .select('id, title, summary, url, source, image, published_at, lane, region, lang, pinned')
      .eq('site', 'extrafun')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(60)
    if (error) return res.status(500).json({ message: error.message })
    // Map snake_case → the camelCase the UI expects (publishedAt).
    res.json((data || []).map(n => ({ ...n, publishedAt: n.published_at })))
  })

  app.patch('/api/admin/news/:id/pin', verifyJWT, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    const { error } = await supabaseAdmin.from('news_items').update({ pinned: !!req.body?.pinned }).eq('id', id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  app.delete('/api/admin/news/:id', verifyJWT, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    // Tombstone the URL so the fetcher won't re-add it next run (mirrors gay.pl).
    const { data: row } = await supabaseAdmin.from('news_items').select('url').eq('id', id).maybeSingle()
    if (row?.url) await supabaseAdmin.from('news_deleted').insert({ url: row.url }).then(() => {}, () => {})
    const { error } = await supabaseAdmin.from('news_items').delete().eq('id', id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  // Translate proxy → bizarriusz (holds ANTHROPIC_API_KEY + shared translationsCache).
  // Renders foreign (EN) news titles/leads in Polish.
  app.post('/api/translate', async (req, res) => {
    try {
      const r = await fetch('https://bizarriusz.pl/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      })
      const data = await r.json().catch(() => ({}))
      res.status(r.status).json(data)
    } catch (err) {
      res.status(502).json({ message: err.message })
    }
  })

  // === SHARED LIVE CHAT (same stream as bizarriusz.pl/czat) ===
  // Poczekalnia: to TEN SAM stream co biz — musi stosować te same reguły. GET
  // pokazuje TYLKO publiczne (held=false); wpisy w poczekalni (held=true) NIE
  // wyciekają na ExtraFun. Moderacja (odsłona „Wpuść") dzieje się na biz.
  app.get('/api/shoutbox', optionalAuth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .select('id, user_id, username, content, created_at').eq('source', 'bizarriusz')
      .eq('held', false)
      .order('created_at', { ascending: false }).limit(limit)
    if (error) return res.status(500).json({ message: error.message })
    const rows = (data || []).reverse()
    // Privacy: strip harvestable PII (user_id, full username) for logged-out
    // visitors so an anonymous scraper can't build a user list. Mirrors the
    // bizarriusz.pl fix; logged-in responses untouched.
    const out = req.user ? rows : rows.map(m => ({
      ...m,
      user_id: null,
      username: (m.username || '').trim() ? (m.username.trim()[0].toUpperCase() + '.') : 'Gość',
    }))
    res.json(out)
  })

  app.post('/api/shoutbox', verifyJWT, async (req, res) => {
    const content = (req.body?.content || '').trim()
    if (!content || content.length > 500) return res.status(400).json({ message: 'Invalid content' })
    const meta = req.user.meta || {}
    const username = meta.display_name || meta.full_name || meta.name || meta.username || 'Gość'

    // Poczekalnia (parytet z biz): admin bypass; treść-tabu chowa zawsze; poza
    // tym przechodzi tylko damski nick lub autor na whiteliście (biz_chat_whitelist)
    // — reszta (typowo panowie) → held, widoczna dopiero po „Wpuść" na biz.
    const admin = isAdminEmail(req.user.email)
    let whitelisted = false
    let blacklisted = false
    if (!admin) {
      const { data: wl } = await supabaseAdmin.from('biz_chat_whitelist')
        .select('user_id').eq('user_id', req.user.id).limit(1)
      whitelisted = !!(wl && wl.length)
      const { data: bl } = await supabaseAdmin.from('biz_chat_blacklist')
        .select('user_id').eq('user_id', req.user.id).limit(1)
      blacklisted = !!(bl && bl.length)
    }
    // Blacklist wygrywa nad wszystkim (parytet z biz).
    const held = !admin && (blacklisted || isTabooContent(content) || !(isFemaleNick(username) || whitelisted))

    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .insert({ user_id: req.user.id, username, content, source: 'bizarriusz', held })
      .select('id, user_id, username, content, created_at').single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })

  // === OGŁOSZENIA (shared ads pool) ===
  // Map shared `ads` columns to the fields the ExtraFun UI expects
  // (type←category, city←location).
  app.get('/api/ads', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('ads')
      .select('id, title, description, location, category, latitude, longitude, created_at, author_uuid')
      .eq('status', 'active')
      // bizarriusz.pl daje autorowi checkbox "pokaż też na extrafun.pl"
      // (cross_post_extrafun, domyślnie true). Odznaczony → nie pokazuj tu.
      // Inne źródła (gaypl/extrafun) nie mają tej kolumny ustawionej — przechodzą
      // zawsze przez pierwszy człon OR.
      .or('source.neq.bizarriusz,cross_post_extrafun.not.is.false')
      .order('created_at', { ascending: false }).limit(2000)
    if (error) return res.status(500).json({ message: error.message })
    // Resolve author display names from auth.users (nick lives in user_metadata,
    // not profiles). ad_author_names is a security-definer fn: service_role only,
    // returns just the nick for the ids we pass — no emails leak.
    const ids = [...new Set((data || []).map(a => a.author_uuid).filter(Boolean))]
    const authors = {}
    if (ids.length) {
      const { data: an } = await supabaseAdmin.rpc('ad_authors', { ids })
      for (const r of (an || [])) authors[r.id] = r
    }
    res.json((data || []).map(a => {
      const au = a.author_uuid ? authors[a.author_uuid] : null
      return {
        id: a.id, title: a.title, description: a.description,
        city: a.location, category: a.category || null, type: a.category || null,
        latitude: a.latitude, longitude: a.longitude, created_at: a.created_at,
        author_uuid: a.author_uuid || null,
        author_name: au?.display_name || (a.author_uuid ? 'Użytkownik' : null),
        author_avatar: au?.avatar_url || null,
        author_age: au?.age || null,
        author_looking: au?.looking_for || null,
        author_about: au?.about || null,
      }
    }))
  })

  app.post('/api/ads', verifyJWT, async (req, res) => {
    const { type, title, description, city, latitude, longitude } = req.body || {}
    if (!title?.trim()) return res.status(400).json({ message: 'Tytuł wymagany' })
    const { data, error } = await supabaseAdmin.from('ads').insert({
      title: title.trim(), description: (description || '').trim(),
      category: type || 'inne', location: city || null,
      latitude: latitude || null, longitude: longitude || null,
      status: 'active', source: 'extrafun', author_uuid: req.user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
    }).select('id').single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })

  // Self-service delete — autor kasuje własny anons. Dotąd istniał tylko
  // DELETE /api/admin/ads/:id (admin-only); ten sam brak naprawiony na
  // bizarriusz.pl i gay.pl.
  app.delete('/api/ads/:id', verifyJWT, async (req, res) => {
    const { data: ad, error: fetchErr } = await supabaseAdmin.from('ads')
      .select('id, author_uuid').eq('id', req.params.id).single()
    if (fetchErr || !ad) return res.status(404).json({ message: 'Nie znaleziono' })
    if (ad.author_uuid !== req.user.id) return res.status(403).json({ message: 'Brak dostępu' })
    const { error } = await supabaseAdmin.from('ads').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  // === FINDER (member catalog) ===
  app.get('/api/finder', optionalAuth, async (req, res) => {
    try {
      const all = await loadVisibleProfiles();
      // Gated off, or a guest: count only. Rows stay server-side.
      if (!FINDER_LIVE || !req.user) return res.json({ count: all.length, locked: true });
      const me = req.user.id;
      const blocks = await finderBlockedSet(me);
      const q = String(req.query.q || '').trim().toLowerCase();
      const mode = String(req.query.mode || 'all');
      const visible = all.filter(p => p.id !== me && !blocks.has(p.id));
      // Global stats (unaffected by the current filter) so the client can show
      // "N profili · M ze zdjęciem · K z galerią" regardless of which mode is active.
      const stats = {
        total: visible.length,
        withPhoto: visible.filter(p => !!p.avatarUrl).length,
        withGallery: visible.filter(p => p.hasGallery).length,
      };
      let items = visible;
      if (mode === 'photos') items = items.filter(p => !!p.avatarUrl);
      else if (mode === 'gallery') items = items.filter(p => p.hasGallery);
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
      res.json({ count: items.length, locked: false, items, stats });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // My extrafun visibility (per-portal opt-out). Flag lives in auth user_metadata.
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
    _finderCache = null; // bust cache so the change shows within a request
    res.json({ hiddenFromExtrafun: hidden });
  });

  // Full public profile — lean (no biz groups / club check-in / biz ads).
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

  // Like toggle. No push (extrafun has no VAPID configured) — a match surfaces
  // via GET /api/finder/likes/me instead. Shared profile_likes table means a
  // like here also shows on biz "kto Cię polubił" and vice versa.
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

  // Bidirectional block — clears any existing likes between the pair.
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

  // One-time heads-up DM to everyone in the shared user pool (biz+EF), telling
  // them their profile now also shows on extrafun and how to opt out.
  // Idempotent: a unique PK on site_config.key means a second insert errors,
  // so a second click/retry is a safe no-op (409), never a double-send.
  const EXTRAFUN_FINDER_ANNOUNCE = `Cześć! 🖤
Dział profili przenosimy z bizarriusz na extrafun.pl — Twój profil (nick, zdjęcie, „szukam") będzie tam widoczny. Logujesz się tym samym loginem i hasłem co na bizarriusz.pl. Chcesz zostać widoczny/a? Nie musisz nic robić.
Wiadomości od zainteresowanych Twoim profilem będą przychodzić na Twoją skrzynkę — tak jak dotąd.
Nie chcesz być widoczny/a na extrafun? Wejdź w Profil → „Ukryj mnie w Szukaj na extrafun" i znikasz z listy. W każdej chwili wrócisz.`;

  app.post('/api/admin/finder/broadcast', verifyJWT, isAdmin, async (_req, res) => {
    try {
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
        sender_id: 'ef-finder-announce', sender_name: 'ExtraFun',
        recipient_id: id, recipient_name: '',
        content: EXTRAFUN_FINDER_ANNOUNCE, is_read: false, portal: 'extrafun',
      }));
      for (let i = 0; i < rows.length; i += 500) {
        await supabaseAdmin.from('private_messages').insert(rows.slice(i, i + 500));
      }
      res.json({ sent: ids.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // === PRIVATE MESSAGES (DM ogłoszeniodawca ↔ zainteresowany) ===
  // Send a DM about an ad. Recipient = ad.author_uuid.
  //
  // ad_id był dotąd WYMAGANY na każdej wiadomości, także odpowiedzi w wątku —
  // ale private_messages jest dzielone z bizarriusz.pl (i gay.pl), gdzie DM nie
  // ma pojęcia ogłoszenia (ad_id=null). Odpowiedź na taki wątek (Wiadomosci.jsx
  // wysyła `ad_id: current.ad_id`, czyli null) zawsze padała 400 "ad_id
  // wymagane" — konwersacja między portalami była faktycznie jednokierunkowa.
  // Teraz: ad_id trzeba PODAĆ tylko żeby napisać do autora ogłoszenia (skąd
  // brać odbiorcę). Gdy recipient_id jest podany wprost (odpowiedź w wątku),
  // ad_id jest opcjonalny.
  app.post('/api/messages', verifyJWT, async (req, res) => {
    const { ad_id, content, recipient_id } = req.body || {}
    if (!content?.trim()) return res.status(400).json({ message: 'Treść wymagana' })
    let recipient = recipient_id || null
    let adTitle = null
    if (ad_id) {
      const { data: ad } = await supabaseAdmin.from('ads').select('id, title, author_uuid').eq('id', ad_id).single()
      if (!ad) return res.status(404).json({ message: 'Ogłoszenie nie istnieje' })
      adTitle = ad.title
      recipient = recipient || ad.author_uuid
    }
    if (!recipient) return res.status(400).json({ message: 'Brak odbiorcy — podaj ad_id lub recipient_id' })
    if (recipient === req.user.id) return res.status(400).json({ message: 'Nie możesz pisać do siebie' })
    const meta = req.user.meta || {}
    const senderName = meta.display_name || meta.full_name || meta.name || (req.user.email || '').split('@')[0] || 'Użytkownik'
    const { error } = await supabaseAdmin.from('private_messages').insert({
      ad_id: ad_id || null, ad_title: adTitle, content: content.trim(),
      sender_id: req.user.id, sender_name: senderName,
      recipient_id: recipient, recipient_name: '', is_read: false,
    })
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json({ ok: true })
  })

  // My inbox: all DMs where I am sender or recipient (grouped client-side).
  app.get('/api/messages', verifyJWT, async (req, res) => {
    const me = req.user.id
    const { data, error } = await supabaseAdmin.from('private_messages')
      .select('id, ad_id, ad_title, content, sender_id, sender_name, recipient_id, recipient_name, is_read, created_at')
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  // Unread count (badge).
  app.get('/api/messages/unread', verifyJWT, async (req, res) => {
    const { count, error } = await supabaseAdmin.from('private_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', req.user.id).eq('is_read', false)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ count: count || 0 })
  })

  // Mark all my incoming as read.
  app.post('/api/messages/read', verifyJWT, async (req, res) => {
    await supabaseAdmin.from('private_messages').update({ is_read: true })
      .eq('recipient_id', req.user.id).eq('is_read', false)
    res.json({ ok: true })
  })

  // === ADMIN ===
  app.get('/api/admin/articles', verifyJWT, isAdmin, async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, category_slug, status, featured, cover_image, content, author, tags, views, publish_date, created_at')
      .eq('site', 'extrafun').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  app.post('/api/admin/articles', verifyJWT, isAdmin, async (req, res) => {
    const payload = { ...req.body, site: 'extrafun' }
    const { data, error } = await supabaseAdmin.from('articles').insert(payload).select('id').single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json({ ok: true, id: data.id })
  })

  app.put('/api/admin/articles/:id', verifyJWT, isAdmin, async (req, res) => {
    const body = { ...req.body }
    // Editing an already-published article (new cover, typo fix, retag...) must
    // NOT bump publish_date — the feed and the mobile/aside banners sort by it,
    // so touching it shoves a months-old piece to the top like it's brand new.
    // Only a genuine draft/scheduled → published transition should set it.
    const { data: existing } = await supabaseAdmin.from('articles').select('status').eq('id', req.params.id).single()
    if (existing && existing.status === 'published') delete body.publish_date
    const { error } = await supabaseAdmin.from('articles').update(body).eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  // Cover image upload: base64 dataURL → Supabase Storage (article-covers) → return public URL
  app.post('/api/admin/articles/:id/cover', verifyJWT, isAdmin, async (req, res) => {
    try {
      const { dataUrl } = req.body || {}
      const m = String(dataUrl || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (!m) return res.status(400).json({ message: 'Nieprawidłowy obraz' })
      const contentType = m[1]
      const buf = Buffer.from(m[2], 'base64')
      const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg')
      const bucket = 'article-covers'
      await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {})
      const path = `${req.params.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(path, buf, { contentType, upsert: true })
      if (upErr) return res.status(500).json({ message: upErr.message })
      const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
      const url = pub.publicUrl
      await supabaseAdmin.from('articles').update({ cover_image: url }).eq('id', req.params.id)
      res.json({ cover_image: url })
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  })

  app.delete('/api/admin/articles/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('articles').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.status(204).end()
  })

  app.get('/api/admin/page-views', verifyJWT, isAdmin, async (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 86400000).toISOString()
    // Supabase caps single-query results at 1000 rows — fetch in pages to get real count
    let allRows = []
    let from = 0
    const PAGE = 1000
    while (true) {
      const { data, error } = await supabaseAdmin.from('page_views')
        .select('path, referrer, device, session_id, created_at, is_bot')
        .eq('site', 'extrafun').gte('created_at', since)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)
      if (error) return res.status(500).json({ message: error.message })
      allRows = allRows.concat(data || [])
      if (!data || data.length < PAGE) break
      from += PAGE
    }
    res.json(allRows)
  })

  // Admin: per-card impressions/clicks over the last N days → { 'kind:id': {imp, clicks} }
  app.get('/api/admin/card-stats', verifyJWT, isAdmin, async (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabaseAdmin.from('card_stats')
      .select('kind, ref_id, impressions, clicks')
      .eq('site', 'extrafun').gte('day', since).limit(20000)
    if (error) return res.status(500).json({ message: error.message })
    const out = {}
    for (const r of (data || [])) {
      const k = `${r.kind}:${r.ref_id}`
      out[k] = out[k] || { imp: 0, clicks: 0 }
      out[k].imp += r.impressions; out[k].clicks += r.clicks
    }
    res.json({ days, stats: out })
  })

  app.get('/api/admin/ads', verifyJWT, isAdmin, async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('ads')
      .select('id, title, description, category, status, created_at, location')
      .eq('source', 'extrafun').order('created_at', { ascending: false }).limit(50)
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

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

  // === ADMIN: VENUES (Przewodnik) ===
  // Reads/writes the merged `venues` table (same one /api/places reads — see the
  // comment up there for the merge story). swingers_venues is legacy/frozen: kept
  // in place for a human to drop later, but the admin no longer touches it.
  const VENUE_FIELDS = ['name', 'type', 'scene', 'city', 'address', 'website', 'description', 'logo_url', 'latitude', 'longitude', 'gay_days', 'swing_days']
  // Admin/frontend field name -> venues column name, only where they differ.
  const VENUE_COLUMN = { logo_url: 'cover_image', latitude: 'lat', longitude: 'lng' }
  // Alias venues columns back to the swingers shape the admin UI expects (same aliasing /api/places uses).
  const toAdminVenue = (v) => ({ ...v, latitude: v.lat, longitude: v.lng, logo_url: v.cover_image })

  app.get('/api/admin/venues', verifyJWT, isAdmin, async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('venues')
      .select('id, name, type, scene, city, address, website, description, cover_image, lat, lng, gay_days, swing_days, legacy_swing_id')
      .or('legacy_swing_id.not.is.null,swing_days.not.is.null,type.eq.plaża')
      .order('city', { ascending: true }).order('name', { ascending: true })
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).map(toAdminVenue))
  })

  app.post('/api/admin/venues', verifyJWT, isAdmin, async (req, res) => {
    const b = req.body || {}
    if (!b.name || !b.city) return res.status(400).json({ message: 'name i city wymagane' })
    // New rows are ExtraFun-only by default: is_active=false + gay_days=[] keep
    // them out of gay.pl's directory (mirrors the convention already used for
    // the merged swing rows — see /api/places above). swing_days=[] makes the
    // row match the /api/places filter right away so it appears in the catalog
    // as soon as it's saved (no fake schedule — recurring_events stay empty
    // until the operator adds real ones).
    const row = { type: 'club', scene: 'swing', is_active: false, gay_days: [], swing_days: [] }
    for (const k of VENUE_FIELDS) if (k in b) row[VENUE_COLUMN[k] || k] = b[k] || null
    const { data, error } = await supabaseAdmin.from('venues').insert(row).select().single()
    if (error) return res.status(500).json({ message: error.message })
    res.json(toAdminVenue(data))
  })

  app.put('/api/admin/venues/:id', verifyJWT, isAdmin, async (req, res) => {
    const b = req.body || {}
    const fields = {}
    for (const k of VENUE_FIELDS) if (k in b) fields[VENUE_COLUMN[k] || k] = b[k] === '' ? null : b[k]
    const { error } = await supabaseAdmin.from('venues').update(fields).eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  app.delete('/api/admin/venues/:id', verifyJWT, isAdmin, async (req, res) => {
    const id = req.params.id
    // Guard: venues is shared with gay.pl now. A row with gay_days set is also a
    // gay.pl venue (e.g. the native Bizarriusz/Heaven/Galla/Berlin duplicates) —
    // never hard-delete those from the swing admin, just unlink the swing side.
    const { data: existing } = await supabaseAdmin.from('venues').select('gay_days').eq('id', id).maybeSingle()
    if (existing?.gay_days && existing.gay_days.length > 0) {
      const { error } = await supabaseAdmin.from('venues').update({ swing_days: null, legacy_swing_id: null }).eq('id', id)
      if (error) return res.status(500).json({ message: error.message })
      return res.status(204).end()
    }
    await supabaseAdmin.from('recurring_events').delete().eq('venue_id', id)
    await supabaseAdmin.from('one_time_events').delete().eq('venue_id', id)
    const { error } = await supabaseAdmin.from('venues').delete().eq('id', id)
    if (error) return res.status(500).json({ message: error.message })
    res.status(204).end()
  })

  // Logo upload: base64 dataURL → Supabase Storage (venue-logos) → set cover_image.
  app.post('/api/admin/venues/:id/logo', verifyJWT, isAdmin, async (req, res) => {
    try {
      const { dataUrl } = req.body || {}
      const m = String(dataUrl || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (!m) return res.status(400).json({ message: 'Nieprawidłowy obraz' })
      const contentType = m[1]
      const buf = Buffer.from(m[2], 'base64')
      const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg')
      const bucket = 'venue-logos'
      await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {})
      const path = `${req.params.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(path, buf, { contentType, upsert: true })
      if (upErr) return res.status(500).json({ message: upErr.message })
      const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
      const url = pub.publicUrl
      await supabaseAdmin.from('venues').update({ cover_image: url }).eq('id', req.params.id)
      res.json({ logo_url: url })
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  })

  // === VENUE EVENTS (imprezy klubowe + hotelowe) ===
  // venue_events.venue_id still points at the OLD swingers_venues id-space — the
  // DB foreign key (venue_events_venue_id_fkey) was never repointed to `venues`;
  // that's a schema migration and out of scope for this code-only pass. Checked
  // against live data: every event's venue_id already matches a venues.id 1:1
  // except one legacy row that only matches venues.legacy_swing_id. Postgrest
  // embedding needs an actual FK on the target table, which doesn't exist for
  // venues here, so we resolve venue info with a second query instead of an
  // embed — matching by id first, legacy_swing_id as fallback (id match always
  // wins so the known id/legacy_swing_id collisions — e.g. gay.pl venues 2, 22,
  // 24, 93, 99, 100 — resolve to the real venue, not a stale swing row).
  async function attachVenueInfo(rows) {
    const ids = [...new Set(rows.map(r => r.venue_id).filter((v) => v != null))]
    if (!ids.length) return rows.map(r => ({ ...r, venue: null }))
    const { data: vs } = await supabaseAdmin.from('venues')
      .select('id, name, city, cover_image, legacy_swing_id')
      .or(`id.in.(${ids.join(',')}),legacy_swing_id.in.(${ids.join(',')})`)
    const byId = {}
    for (const v of (vs || [])) {
      byId[v.id] = v // exact id match always wins, even if set again below
      if (v.legacy_swing_id != null && !(v.legacy_swing_id in byId)) byId[v.legacy_swing_id] = v
    }
    return rows.map(r => {
      const v = r.venue_id != null ? byId[r.venue_id] : null
      return { ...r, venue: v ? { id: v.id, name: v.name, city: v.city, logo_url: v.cover_image } : null }
    })
  }

  app.get('/api/events', async (req, res) => {
    const { from, to, venue_id } = req.query
    const today = new Date().toISOString().slice(0, 10)
    // ExtraFun is the swing/lifestyle site, but venue_events is shared with gay.pl.
    // Without a scene filter /imprezy fills with gay venues abroad (Prague/Berlin/
    // Bangkok). Restrict to swing/mixed venues, matching both venues.id and
    // legacy_swing_id (venue_events.venue_id historically points at the swingers id-space).
    const { data: swingVenues } = await supabaseAdmin.from('venues')
      .select('id, legacy_swing_id').in('scene', ['swing', 'mixed'])
    const allowIds = [...new Set((swingVenues || []).flatMap(v => [v.id, v.legacy_swing_id]).filter(x => x != null))]
    if (!allowIds.length) return res.json([])
    // Dated swing events live in one_time_events (venue_events is the gay.pl-shared
    // table and holds no swing dates). Alias external_link -> event_url for the
    // frontend's EventCard.
    let q = supabaseAdmin.from('one_time_events')
      .select('id, venue_id, event_date, event_name, start_time, end_time, price, location_name, location_address, organizer, event_url:external_link, description, cover_image, is_external')
      .in('venue_id', venue_id ? [Number(venue_id)] : allowIds)
      .gte('event_date', from || today)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(200)
    if (to) q = q.lte('event_date', to)
    const { data, error } = await q
    if (error) return res.status(500).json({ message: error.message })
    res.json(await attachVenueInfo(data || []))
  })

  // === CALENDAR EVENTS ===
  app.get('/api/calendar', async (req, res) => {
    const now = new Date()
    const month = parseInt(req.query.month) || (now.getMonth() + 1)
    const day = parseInt(req.query.day) || now.getDate()
    const { data, error } = await supabaseAdmin.from('calendar_events')
      .select('id, month, day, year, type, name, description, tags, site, wiki_url')
      .eq('month', month)
      .eq('day', day)
      .in('site', ['extrafun', 'both'])
      .order('type', { ascending: true })
      .limit(10)
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
  })

  // === ADMIN: EVENTS ===
  app.get('/api/admin/events', verifyJWT, isAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin.from('venue_events')
      .select('id, venue_id, event_date, event_name, start_time, end_time, price, location_name, location_address, organizer, event_url, description, cover_image, is_external')
      .order('event_date', { ascending: false }).limit(200)
    if (error) return res.status(500).json({ message: error.message })
    res.json(await attachVenueInfo(data || []))
  })

  app.post('/api/admin/events', verifyJWT, isAdmin, async (req, res) => {
    const b = req.body || {}
    if (!b.event_name || !b.event_date) return res.status(400).json({ message: 'event_name i event_date wymagane' })
    const EVENT_FIELDS = ['venue_id', 'event_date', 'event_name', 'start_time', 'end_time', 'price', 'location_name', 'location_address', 'organizer', 'event_url', 'description', 'cover_image', 'is_external']
    const row = {}
    for (const k of EVENT_FIELDS) if (k in b) row[k] = b[k] === '' ? null : b[k]
    const { data, error } = await supabaseAdmin.from('venue_events').insert(row).select().single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })

  app.put('/api/admin/events/:id', verifyJWT, isAdmin, async (req, res) => {
    const b = req.body || {}
    const EVENT_FIELDS = ['venue_id', 'event_date', 'event_name', 'start_time', 'end_time', 'price', 'location_name', 'location_address', 'organizer', 'event_url', 'description', 'cover_image', 'is_external']
    const fields = {}
    for (const k of EVENT_FIELDS) if (k in b) fields[k] = b[k] === '' ? null : b[k]
    const { error } = await supabaseAdmin.from('venue_events').update(fields).eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.json({ ok: true })
  })

  app.delete('/api/admin/events/:id', verifyJWT, isAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('venue_events').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ message: error.message })
    res.status(204).end()
  })

  // === SEO ===
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /profil

# AI usage preferences (IETF draft content-signals)
Content-Signal: ai-train=yes, search=yes, ai-retrieval=yes

Sitemap: https://www.extrafun.pl/sitemap.xml`)
  })

  // llms.txt — site summary for AI engines. Real route so the SPA fallback
  // doesn't shadow it with index.html. Dynamic (30 min cache): the static
  // version listed only fixed pages, so AI crawlers had no article/term links
  // to follow past them. Mirrors the sitemap.xml data sources below.
  let llmsTxtCache = null
  const LLMS_TTL = 30 * 60 * 1000
  app.get('/llms.txt', async (_req, res) => {
    if (llmsTxtCache && Date.now() - llmsTxtCache.at < LLMS_TTL) {
      res.type('text/markdown').send(llmsTxtCache.text)
      return
    }
    let articleLines = ''
    try {
      const { data } = await supabaseAdmin.from('articles')
        .select('title, slug').eq('site', 'extrafun').eq('status', 'published')
        .order('publish_date', { ascending: false })
      articleLines = (data || []).map(a => `- [${a.title}](https://www.extrafun.pl/magazyn/${a.slug})`).join('\n')
    } catch { /* ship the rest even if this fails */ }
    let termLines = ''
    try {
      const { DICTIONARY_TERMS: terms } = await import('../src/lib/dictionary.js')
      termLines = terms.map(t => `- [${t.term}](https://www.extrafun.pl/slownik/${t.slug})`).join('\n')
    } catch { /* dictionary optional */ }
    const text =
`# ExtraFun

> ExtraFun — polski magazyn i społeczność CNM/lifestyle: konsensualna niemonogamia, poliamoria, swing, fetysz oraz katalog klubów lifestyle i miejsc w Polsce.

## Sekcje
- [Magazyn](https://www.extrafun.pl/magazyn): Artykuły o CNM, poliamorii, swingu, otwartych związkach, fetyszu i lifestyle.
- [Słownik](https://www.extrafun.pl/slownik): Wyjaśnienia pojęć CNM, poliamorii, swingu i BDSM po polsku.
- [Miejsca](https://www.extrafun.pl/miejsca): Katalog klubów lifestyle, swingers i miejsc w Polsce.
- [Imprezy](https://www.extrafun.pl/imprezy): Wydarzenia i imprezy lifestyle.
- [Plaże](https://www.extrafun.pl/plaze): Plaże naturystyczne i przyjazne lifestyle.

## Magazyn — artykuły
${articleLines}

## Słownik CNM — pojęcia
${termLines}

## Key Facts
- ExtraFun to polski portal lifestyle/CNM: magazyn + słownik + katalog miejsc.
- Tematyka: konsensualna niemonogamia, poliamoria, swing, otwarte związki, fetysz, naturyzm.
- Język: polski.

## Contact
- Website: https://www.extrafun.pl
`
    llmsTxtCache = { at: Date.now(), text }
    res.type('text/markdown').send(text)
  })

  app.get('/sitemap.xml', async (_req, res) => {
    const { data } = await supabaseAdmin.from('articles')
      .select('slug, publish_date').eq('site', 'extrafun').eq('status', 'published')
    const staticUrls = [
      { loc: 'https://www.extrafun.pl/', priority: '1.0' },
      { loc: 'https://www.extrafun.pl/magazyn', priority: '0.9' },
      { loc: 'https://www.extrafun.pl/slownik', priority: '0.9' },
      { loc: 'https://www.extrafun.pl/miejsca', priority: '0.7' },
      { loc: 'https://www.extrafun.pl/imprezy', priority: '0.7' },
      { loc: 'https://www.extrafun.pl/czat', priority: '0.5' },
      { loc: 'https://www.extrafun.pl/ogloszenia', priority: '0.6' },
    ]
    const articleUrls = (data || []).map(a => ({
      loc: `https://www.extrafun.pl/magazyn/${a.slug}`, priority: '0.8',
      lastmod: a.publish_date ? new Date(a.publish_date).toISOString().slice(0, 10) : undefined,
    }))
    let dictUrls = []
    try {
      const { DICTIONARY_TERMS: terms } = await import('../src/lib/dictionary.js')
      dictUrls = terms.map(t => ({ loc: `https://www.extrafun.pl/slownik/${t.slug}`, priority: '0.7' }))
    } catch {}
    // Per-venue pages (same set the catalog shows: swing/lifestyle rows).
    let venueUrls = []
    try {
      const slugify = (s) => String(s).toLowerCase().replace(/ł/g, 'l')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const { data: vs } = await supabaseAdmin.from('venues')
        .select('id, name, city')
        .or('legacy_swing_id.not.is.null,swing_days.not.is.null')
      venueUrls = (vs || []).map(v => ({
        loc: `https://www.extrafun.pl/miejsca/${v.id}-${slugify(v.name)}${v.city ? '-' + slugify(v.city) : ''}`,
        priority: '0.6',
      }))
    } catch {}
    const urls = [...staticUrls, ...articleUrls, ...dictUrls, ...venueUrls]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
    // This handler shadows the one in index.js (registerRoutes runs first), and
    // that one was the only place setting a cache header — so the sitemap was
    // answering with none at all.
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.type('application/xml').send(xml)
  })
}
