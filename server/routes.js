import { supabaseAdmin } from './supabase.js'
import { verifyJWT, isAdmin } from './auth.js'

export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // === MIEJSCA (swingers venues directory) ===
  app.get('/api/places', async (_req, res) => {
    const { data: venues, error } = await supabaseAdmin.from('swingers_venues')
      .select('id, name, type, address, city, description, website, latitude, longitude, logo_url')
      .order('city', { ascending: true })
    if (error) return res.status(500).json({ message: error.message })
    // Attach the weekly schedule (recurring_events) to each venue.
    const { data: events } = await supabaseAdmin.from('recurring_events')
      .select('id, venue_id, day_of_week, event_name, description, start_time, end_time, price, tags')
      .or('is_active.is.null,is_active.eq.true')
      .order('day_of_week', { ascending: true })
    const byVenue = {}
    for (const e of (events || [])) (byVenue[e.venue_id] ||= []).push(e)
    res.json((venues || []).map(v => ({ ...v, events: byVenue[v.id] || [] })))
  })

  // === ANALYTICS ===
  app.post('/api/track', async (req, res) => {
    const { path, referrer, device, sessionId } = req.body || {}
    if (!path) return res.status(400).json({ message: 'path required' })
    await supabaseAdmin.from('page_views').insert({
      site: 'extrafun', path: String(path).slice(0, 200),
      referrer: referrer ? String(referrer).slice(0, 100) : null,
      device: device || null, session_id: sessionId ? String(sessionId).slice(0, 40) : null,
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

  // === ARTICLES (Magazyn) ===

  // Published extrafun articles — list for Magazyn
  app.get('/api/articles', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('articles')
      .select('id, title, slug, excerpt, content, category_slug, cover_image, featured')
      .eq('site', 'extrafun').eq('status', 'published')
      .order('created_at', { ascending: false })
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

  // === SHARED LIVE CHAT (same stream as bizarriusz.pl/czat) ===
  app.get('/api/shoutbox', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .select('id, user_id, username, content, created_at').eq('source', 'bizarriusz')
      .order('created_at', { ascending: false }).limit(limit)
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).reverse())
  })

  app.post('/api/shoutbox', verifyJWT, async (req, res) => {
    const content = (req.body?.content || '').trim()
    if (!content || content.length > 500) return res.status(400).json({ message: 'Invalid content' })
    const meta = req.user.meta || {}
    const username = meta.display_name || meta.full_name || meta.name || meta.username || 'Gość'
    const { data, error } = await supabaseAdmin.from('shoutbox_messages')
      .insert({ user_id: req.user.id, username, content, source: 'bizarriusz' })
      .select('id, user_id, username, content, created_at').single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(data)
  })

  // === OGŁOSZENIA (shared ads pool) ===
  // Map shared `ads` columns to the fields the ExtraFun UI expects
  // (type←category, city←location).
  app.get('/api/ads', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('ads')
      .select('id, title, description, location, category, latitude, longitude, created_at')
      .eq('status', 'active').order('created_at', { ascending: false }).limit(100)
    if (error) return res.status(500).json({ message: error.message })
    res.json((data || []).map(a => ({
      id: a.id, title: a.title, description: a.description,
      city: a.location, type: a.category || 'all',
      latitude: a.latitude, longitude: a.longitude, created_at: a.created_at,
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
    const { error } = await supabaseAdmin.from('articles').insert(payload)
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json({ ok: true })
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

  app.get('/api/admin/page-views', verifyJWT, isAdmin, async (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const { data, error } = await supabaseAdmin.from('page_views')
      .select('path, referrer, device, session_id, created_at')
      .eq('site', 'extrafun').gte('created_at', since)
      .order('created_at', { ascending: false }).limit(5000)
    if (error) return res.status(500).json({ message: error.message })
    res.json(data || [])
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

  // === SEO ===
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
}
