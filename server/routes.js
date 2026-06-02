import { supabaseAdmin } from './supabase.js'
import { verifyJWT } from './auth.js'

export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }))

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
}
