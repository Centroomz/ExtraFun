import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase.js'
import { DICTIONARY_TERMS } from '../src/lib/dictionary.js'

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Mirror of the frontend slugify/venueSlug (src/pages/Przewodnik.jsx) so the
// sitemap URLs match the canonical links the SPA emits — no duplicate-URL split.
function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function venueSlug(v) {
  return `${v.id}-${slugify(v.name)}${v.city ? '-' + slugify(v.city) : ''}`
}

const BASE = 'https://extrafun.pl'

// Dynamic sitemap built from the live DB (articles + venues the site shows +
// glossary terms) instead of a hand-maintained static file. This is what gets
// the bulk of pages discovered by Google/AI crawlers.
export async function sendSitemap(_req, res) {
  const urls = []
  const add = (loc, changefreq, priority, lastmod) =>
    urls.push({ loc: BASE + loc, changefreq, priority, lastmod })

  // Static section pages.
  add('/magazyn', 'daily', '1.0')
  add('/miejsca', 'weekly', '0.8')
  add('/plaze', 'weekly', '0.6')
  add('/imprezy', 'weekly', '0.7')
  add('/slownik', 'weekly', '0.6')
  add('/ogloszenia', 'daily', '0.6')
  add('/czat', 'weekly', '0.4')

  try {
    const { data: articles } = await supabaseAdmin.from('articles')
      .select('slug, updated_at, publish_date, created_at')
      .eq('site', 'extrafun').eq('status', 'published')
    for (const a of (articles || [])) {
      if (!a.slug) continue
      const lm = a.updated_at || a.publish_date || a.created_at
      add(`/magazyn/${a.slug}`, 'monthly', '0.9', lm ? new Date(lm).toISOString().slice(0, 10) : undefined)
    }
  } catch { /* skip articles on error, still emit the rest */ }

  try {
    // Same filter as /api/places: swing-scene venues + beaches (what /miejsca lists).
    const { data: venues } = await supabaseAdmin.from('venues')
      .select('id, name, city')
      .or('legacy_swing_id.not.is.null,swing_days.not.is.null,type.eq.plaża')
    for (const v of (venues || [])) {
      if (!v.id || !v.name) continue
      add(`/miejsca/${venueSlug(v)}`, 'weekly', '0.7')
    }
  } catch { /* skip venues on error */ }

  try {
    for (const t of DICTIONARY_TERMS) {
      if (t?.slug) add(`/slownik/${t.slug}`, 'monthly', '0.5')
    }
  } catch { /* skip terms on error */ }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${esc(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.send(body)
}

// For /magazyn/:slug, inject the article's real title/description/OG into
// index.html before sending, so crawlers get proper metadata despite the SPA.
export async function sendArticleHtml(req, res, dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const { data } = await supabaseAdmin.from('articles')
      .select('title, excerpt, slug, cover_image, seo_title, seo_description, author, publish_date, created_at, updated_at, content')
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
      // Full text in JSON-LD so AI crawlers (no JS) read the whole article
      // despite the client-rendered SPA body.
      ...(data.content
        ? { articleBody: String(data.content).replace(/<[^>]+>/g, ' ').replace(/[#*_`>\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000) }
        : {}),
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

// For /miejsca/:slug (id-prefixed, e.g. 123-heaven-warszawa) inject per-venue
// meta + LocalBusiness JSON-LD so each club is a real indexable, AI-citable page.
export async function sendVenueHtml(req, res, dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const id = parseInt(req.params.slug, 10)
    if (Number.isNaN(id)) return res.send(html)
    const { data } = await supabaseAdmin.from('venues')
      .select('id, name, type, address, city, description, website, phone, lat, lng, cover_image')
      .eq('id', id).maybeSingle()
    if (!data) return res.send(html)
    const title = esc(`${data.name}${data.city ? ' – ' + data.city : ''} | ExtraFun`)
    const desc = esc((data.description || `${data.name} — klub lifestyle w ${data.city || 'Polsce'}.`).slice(0, 160))
    const url = `https://extrafun.pl/miejsca/${req.params.slug}`
    const img = data.cover_image ? esc(data.cover_image) : 'https://extrafun.pl/og-default.jpg'
    const ld = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: data.name,
      ...(data.description ? { description: data.description } : {}),
      ...(data.cover_image ? { image: data.cover_image } : {}),
      url,
      ...(data.website ? { sameAs: [data.website] } : {}),
      ...(data.phone ? { telephone: data.phone } : {}),
      address: {
        '@type': 'PostalAddress',
        ...(data.address ? { streetAddress: data.address } : {}),
        ...(data.city ? { addressLocality: data.city } : {}),
        addressCountry: 'PL',
      },
      ...(data.lat && data.lng
        ? { geo: { '@type': 'GeoCoordinates', latitude: Number(data.lat), longitude: Number(data.lng) } }
        : {}),
    }).replace(/</g, '\\u003c')
    const tags = `<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="business.business" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />
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
