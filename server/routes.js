import { supabaseAdmin } from './supabase.js'
import { verifyJWT, isAdmin, isAdminEmail } from './auth.js'
import { isFemaleNick, isTabooContent } from './chat-gender.js'

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
    res.json((venues || []).map(v => {
      const sd = v.swing_days, gd = v.gay_days
      const allow = (dow) => !sd || sd.includes(dow)
      const label = (dow) => sd ? (gd && gd.includes(dow) ? 'Panie i Panowie' : 'Pary i single') : null
      const key = v.id   // events re-keyed to own venues.id (migration 2026-07-08); legacy_swing_id no longer used for lookup — avoids ID collision with gay.pl venues
      const events = (byVenue[key] || []).filter(e => allow(e.day_of_week)).map(e => ({ ...e, audience: label(e.day_of_week) }))
      // Alias venues columns back to the swingers shape the frontend expects.
      return { ...v, latitude: v.lat, longitude: v.lng, logo_url: v.cover_image, events, oneTime: otByVenue[key] || [] }
    }))
  })

  // === ANALYTICS ===
  app.post('/api/track', async (req, res) => {
    const { path, referrer, device, sessionId, utmSource, utmMedium } = req.body || {}
    if (!path) return res.status(400).json({ message: 'path required' })
    // Flag bots by user-agent — don't block, just mark, so dashboards split real vs
    // bot (a headless-crawler burst like 2026-07-17 shouldn't read as growth). Empty
    // UA = flagged; real browsers always send one.
    const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|python-|urllib|curl\/|wget|scrapy|http-?client|go-http|java\/|node-fetch|axios\/|okhttp|bytespider|gptbot|claudebot|ccbot|perplexity|amazonbot|dataforseo|semrush|ahrefs|dotbot|mj12|petalbot|yandex|bingpreview|facebookexternalhit|meta-externalagent/i
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
    res.json(data || [])
  })

  // Single article by slug (+ fire-and-forget view increment)
  app.get('/api/articles/:slug', async (req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, content, category_slug, cover_image, featured, seo_title, seo_description, author, tags, publish_date, created_at')
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
  app.get('/api/shoutbox', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .select('id, user_id, username, content, created_at').eq('source', 'bizarriusz')
      .eq('held', false)
      .order('created_at', { ascending: false }).limit(limit)
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).reverse())
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
    if (!admin) {
      const { data: wl } = await supabaseAdmin.from('biz_chat_whitelist')
        .select('user_id').eq('user_id', req.user.id).limit(1)
      whitelisted = !!(wl && wl.length)
    }
    const held = !admin && (isTabooContent(content) || !(isFemaleNick(username) || whitelisted))

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
      .eq('status', 'active').order('created_at', { ascending: false }).limit(100)
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).map(a => ({
      id: a.id, title: a.title, description: a.description,
      city: a.location, type: a.category || 'all',
      latitude: a.latitude, longitude: a.longitude, created_at: a.created_at,
      author_uuid: a.author_uuid || null,
    })))
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

  // === PRIVATE MESSAGES (DM ogłoszeniodawca ↔ zainteresowany) ===
  // Send a DM about an ad. Recipient = ad.author_uuid.
  app.post('/api/messages', verifyJWT, async (req, res) => {
    const { ad_id, content, recipient_id } = req.body || {}
    if (!content?.trim()) return res.status(400).json({ message: 'Treść wymagana' })
    if (!ad_id) return res.status(400).json({ message: 'ad_id wymagane' })
    const { data: ad } = await supabaseAdmin.from('ads').select('id, title, author_uuid').eq('id', ad_id).single()
    if (!ad || !ad.author_uuid) return res.status(404).json({ message: 'Ogłoszenie nie istnieje lub bez autora (demo)' })
    // Initial contact → recipient = ad author. Reply in a thread → explicit recipient_id (the partner).
    const recipient = recipient_id || ad.author_uuid
    if (recipient === req.user.id) return res.status(400).json({ message: 'Nie możesz pisać do siebie' })
    const meta = req.user.meta || {}
    const senderName = meta.display_name || meta.full_name || meta.name || (req.user.email || '').split('@')[0] || 'Użytkownik'
    const { error } = await supabaseAdmin.from('private_messages').insert({
      ad_id: ad.id, ad_title: ad.title, content: content.trim(),
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
      .select('id, title, slug, excerpt, category_slug, status, featured, cover_image, content, author, tags, views, created_at')
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
    const { error } = await supabaseAdmin.from('articles').update(req.body).eq('id', req.params.id)
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
    let q = supabaseAdmin.from('venue_events')
      .select('id, venue_id, event_date, event_name, start_time, end_time, price, location_name, location_address, organizer, event_url, description, cover_image, is_external')
      .gte('event_date', from || today)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(100)
    if (to) q = q.lte('event_date', to)
    if (venue_id) q = q.eq('venue_id', venue_id)
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

Sitemap: https://extrafun.pl/sitemap.xml`)
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
      articleLines = (data || []).map(a => `- [${a.title}](https://extrafun.pl/magazyn/${a.slug})`).join('\n')
    } catch { /* ship the rest even if this fails */ }
    let termLines = ''
    try {
      const { DICTIONARY_TERMS: terms } = await import('../src/lib/dictionary.js')
      termLines = terms.map(t => `- [${t.term}](https://extrafun.pl/slownik/${t.slug})`).join('\n')
    } catch { /* dictionary optional */ }
    const text =
`# ExtraFun

> ExtraFun — polski magazyn i społeczność CNM/lifestyle: konsensualna niemonogamia, poliamoria, swing, fetysz oraz katalog klubów lifestyle i miejsc w Polsce.

## Sekcje
- [Magazyn](https://extrafun.pl/magazyn): Artykuły o CNM, poliamorii, swingu, otwartych związkach, fetyszu i lifestyle.
- [Słownik](https://extrafun.pl/slownik): Wyjaśnienia pojęć CNM, poliamorii, swingu i BDSM po polsku.
- [Miejsca](https://extrafun.pl/miejsca): Katalog klubów lifestyle, swingers i miejsc w Polsce.
- [Imprezy](https://extrafun.pl/imprezy): Wydarzenia i imprezy lifestyle.
- [Plaże](https://extrafun.pl/plaze): Plaże naturystyczne i przyjazne lifestyle.

## Magazyn — artykuły
${articleLines}

## Słownik CNM — pojęcia
${termLines}

## Key Facts
- ExtraFun to polski portal lifestyle/CNM: magazyn + słownik + katalog miejsc.
- Tematyka: konsensualna niemonogamia, poliamoria, swing, otwarte związki, fetysz, naturyzm.
- Język: polski.

## Contact
- Website: https://extrafun.pl
`
    llmsTxtCache = { at: Date.now(), text }
    res.type('text/markdown').send(text)
  })

  app.get('/sitemap.xml', async (_req, res) => {
    const { data } = await supabaseAdmin.from('articles')
      .select('slug, publish_date').eq('site', 'extrafun').eq('status', 'published')
    const staticUrls = [
      { loc: 'https://extrafun.pl/', priority: '1.0' },
      { loc: 'https://extrafun.pl/magazyn', priority: '0.9' },
      { loc: 'https://extrafun.pl/slownik', priority: '0.9' },
      { loc: 'https://extrafun.pl/miejsca', priority: '0.7' },
      { loc: 'https://extrafun.pl/imprezy', priority: '0.7' },
      { loc: 'https://extrafun.pl/czat', priority: '0.5' },
      { loc: 'https://extrafun.pl/ogloszenia', priority: '0.6' },
    ]
    const articleUrls = (data || []).map(a => ({
      loc: `https://extrafun.pl/magazyn/${a.slug}`, priority: '0.8',
      lastmod: a.publish_date ? new Date(a.publish_date).toISOString().slice(0, 10) : undefined,
    }))
    let dictUrls = []
    try {
      const { DICTIONARY_TERMS: terms } = await import('../src/lib/dictionary.js')
      dictUrls = terms.map(t => ({ loc: `https://extrafun.pl/slownik/${t.slug}`, priority: '0.7' }))
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
        loc: `https://extrafun.pl/miejsca/${v.id}-${slugify(v.name)}${v.city ? '-' + slugify(v.city) : ''}`,
        priority: '0.6',
      }))
    } catch {}
    const urls = [...staticUrls, ...articleUrls, ...dictUrls, ...venueUrls]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
    res.type('application/xml').send(xml)
  })
}
