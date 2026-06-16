import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase.js'
import { DICTIONARY_TERMS } from '../src/lib/dictionary.js'

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

// For /slownik/:slug, inject the term's real title/description/DefinedTerm JSON-LD
// into index.html before sending, so crawlers get the glossary entry despite the SPA.
export function sendDictTermHtml(req, res, dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const term = DICTIONARY_TERMS.find(t => t.slug === req.params.slug)
    if (!term) return res.send(html)
    const title = esc(`${term.term} – co to znaczy? | Słownik ExtraFun`)
    const desc = esc(term.definition.slice(0, 155) + (term.definition.length > 155 ? '…' : ''))
    const url = `https://extrafun.pl/slownik/${term.slug}`
    const ld = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: term.term,
      description: term.definition,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Słownik ExtraFun', url: 'https://extrafun.pl/slownik' },
    }).replace(/</g, '\\u003c')
    const tags = `<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${url}" />
<script type="application/ld+json">${ld}</script>`
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
