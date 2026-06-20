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
      .select('title, excerpt, slug, cover_image, seo_title, seo_description, author, publish_date, created_at, updated_at')
      .eq('site', 'extrafun').eq('status', 'published').eq('slug', req.params.slug)
      .maybeSingle()
    if (!data) return res.send(html)
    const title = esc(data.seo_title || `${data.title} | ExtraFun`)
    const desc = esc(data.seo_description || data.excerpt || '')
    const url = `https://extrafun.pl/magazyn/${data.slug}`
    const img = data.cover_image ? esc(data.cover_image) : 'https://extrafun.pl/og-default.jpg'
    // Article JSON-LD — lets AI engines treat the page as a citable article with
    // author/dates/publisher, not just an OG preview.
    const published = data.publish_date || data.created_at
    const modified = data.updated_at || published
    const articleLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      ...(data.excerpt ? { description: data.excerpt } : {}),
      ...(data.cover_image ? { image: [data.cover_image] } : {}),
      ...(published ? { datePublished: new Date(published).toISOString() } : {}),
      ...(modified ? { dateModified: new Date(modified).toISOString() } : {}),
      author: { '@type': 'Person', name: (data.author || 'Redakcja ExtraFun').toString() },
      publisher: {
        '@type': 'Organization',
        name: 'ExtraFun',
        url: 'https://extrafun.pl',
        logo: { '@type': 'ImageObject', url: 'https://extrafun.pl/icon-192.png' },
      },
      mainEntityOfPage: url,
    }).replace(/</g, '\\u003c')
    const tags = `<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />
<script type="application/ld+json">${articleLd}</script>`
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

// For the homepage, inject Organization + WebSite JSON-LD so AI engines recognize
// what ExtraFun IS as an entity (was zero structured data on the homepage).
export function sendHomeHtml(_req, res, dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const ld = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://extrafun.pl/#organization',
          name: 'ExtraFun',
          url: 'https://extrafun.pl',
          logo: { '@type': 'ImageObject', url: 'https://extrafun.pl/icon-192.png' },
          description: 'ExtraFun — magazyn i społeczność CNM/lifestyle: konsensualna niemonogamia, poliamoria, swing, fetysz, plus katalog klubów lifestyle i miejsc w Polsce.',
          knowsAbout: [
            'konsensualna niemonogamia (CNM)', 'poliamoria', 'swing', 'otwarte związki',
            'fetysz i BDSM', 'kluby lifestyle w Polsce', 'naturyzm',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://extrafun.pl/#website',
          name: 'ExtraFun',
          url: 'https://extrafun.pl',
          inLanguage: 'pl-PL',
          publisher: { '@id': 'https://extrafun.pl/#organization' },
        },
      ],
    }).replace(/</g, '\\u003c')
    const injected = html.replace('</head>', `<script type="application/ld+json">${ld}</script>\n</head>`)
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
