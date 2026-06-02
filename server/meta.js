import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase.js'

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// For /magazyn/:slug, inject the article's real title/description/OG into
// index.html before sending, so crawlers get proper metadata despite the SPA.
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
    // Strip the template's static SEO tags so we don't emit duplicate
    // title/description/canonical/OG (duplicate canonical hurts indexing).
    const injected = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<link[^>]+rel="canonical"[^>]*>/i, '')
      .replace(/<meta[^>]+name="description"[^>]*>/i, '')
      .replace(/<meta[^>]+property="og:(?:title|description|url|image)"[^>]*>/gi, '')
      .replace('</head>', `${tags}\n</head>`)
    res.send(injected)
  } catch {
    res.send(html)
  }
}
