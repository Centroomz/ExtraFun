import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase.js'
import { DICTIONARY_TERMS } from '../src/lib/dictionary.js'
import { getMonthTheme } from '../src/lib/theme-month.js'
import { SLUG_TO_DISPLAY, RUBRYKA_GROUPS } from '../src/lib/rubryki.js'

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// NOTE: the real /sitemap.xml is served from server/routes.js (registerRoutes()
// runs before this module's routes and wins) — a sendSitemap() used to live
// here too but never ran; removed to stop the duplicate definition drifting
// out of sync with the one that's actually live again.

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
    const url = `https://www.extrafun.pl/magazyn/${data.slug}`
    const img = data.cover_image ? esc(data.cover_image) : 'https://www.extrafun.pl/og-default.jpg'
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
        url: 'https://www.extrafun.pl',
        logo: { '@type': 'ImageObject', url: 'https://www.extrafun.pl/icon-192.png' },
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

// Top-level list/hub pages (/imprezy, /plaze, /slownik, /miejsca, /szukaj) had
// NO dedicated handler — they fell through to the generic SPA index.html, which
// carries the homepage's <title>/canonical baked in. Google saw every one of
// them as "duplicate, canonical points elsewhere" and never indexed them
// separately. Self-canonical + real title/desc per route fixes that.
export function sendListPageHtml(req, res, dist, { title, desc }) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  try {
    const url = `https://www.extrafun.pl${req.path}`
    const tags = `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${url}" />`
    const injected = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<link[^>]+rel="canonical"[^>]*>/i, '')
      .replace(/<meta[^>]+name="description"[^>]*>/i, '')
      .replace(/<meta[^>]+property="og:(?:title|description|url)"[^>]*>/gi, '')
      .replace('</head>', `${tags}\n</head>`)
    res.send(injected)
  } catch {
    res.send(html)
  }
}

// For the homepage, inject Organization + WebSite JSON-LD so AI engines recognize
// what ExtraFun IS as an entity (was zero structured data on the homepage).
export function sendHomeHtml(_req, res, dist) {
  let html = readFileSync(join(dist, 'index.html'), 'utf8')
  // LCP on mobile is the Temat Miesiąca cover (hero tile), known from config —
  // preload it from the HTML so it doesn't wait for the bundle to execute
  // (Lighthouse 4G: ~2.6s "load delay" before the browser even asked for it).
  const theme = getMonthTheme()
  if (theme?.image) {
    html = html.replace('</head>', `<link rel="preload" as="image" href="${esc(theme.image)}" fetchpriority="high">
</head>`)
  }
  try {
    const ld = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.extrafun.pl/#organization',
          name: 'ExtraFun',
          url: 'https://www.extrafun.pl',
          logo: { '@type': 'ImageObject', url: 'https://www.extrafun.pl/icon-192.png' },
          description: 'ExtraFun — magazyn i społeczność CNM/lifestyle: konsensualna niemonogamia, poliamoria, swing, fetysz, plus katalog klubów lifestyle i miejsc w Polsce.',
          knowsAbout: [
            'konsensualna niemonogamia (CNM)', 'poliamoria', 'swing', 'otwarte związki',
            'fetysz i BDSM', 'kluby lifestyle w Polsce', 'naturyzm',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://www.extrafun.pl/#website',
          name: 'ExtraFun',
          url: 'https://www.extrafun.pl',
          inLanguage: 'pl-PL',
          publisher: { '@id': 'https://www.extrafun.pl/#organization' },
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
    const url = `https://www.extrafun.pl/miejsca/${req.params.slug}`
    const img = data.cover_image ? esc(data.cover_image) : 'https://www.extrafun.pl/og-default.jpg'
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
    const url = `https://www.extrafun.pl/slownik/${term.slug}`
    const ld = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: term.term,
      description: term.definition,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Słownik ExtraFun', url: 'https://www.extrafun.pl/slownik' },
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

// Mirror of resolveRubryka() in src/pages/KategoriaPage.jsx, minus the 'temat'
// (monthly-theme) case — that one keeps changing labels and isn't worth a
// distinct indexable URL, so it falls through to the generic SPA title.
function resolveRubrykaLabel(param) {
  if (param === 'temat') return null
  if (RUBRYKA_GROUPS[param]) return RUBRYKA_GROUPS[param].label
  return SLUG_TO_DISPLAY[param] || null
}

// /magazyn/rubryka/:slug had NO server-side meta at all (not even the
// generic list-page fallback) — every category fed Google the homepage's
// title/canonical, same duplicate-content problem sendListPageHtml fixed
// for /imprezy, /plaze, /slownik, /miejsca, /szukaj.
export function sendKategoriaHtml(req, res, dist) {
  const label = resolveRubrykaLabel(req.params.slug)
  if (!label) return res.sendFile(join(dist, 'index.html'))
  return sendListPageHtml(req, res, dist, {
    title: `${label} – artykuły | ExtraFun`,
    desc: `Artykuły z rubryki ${label} na ExtraFun — magazynie o CNM, poliamorii, swingu i lifestyle.`,
  })
}
