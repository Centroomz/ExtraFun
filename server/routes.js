import { supabaseAdmin } from './supabase.js'

export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }))

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
}
