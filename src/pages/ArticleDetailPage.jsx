import { useState, useEffect } from 'react'
import { useParams, Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { ARTICLES } from '../lib/articles'

const BASE_URL = 'https://extrafun.pl'

const CATEGORY_COLORS = {
  'CNM 101':        { bg: 'rgba(233,193,118,0.12)',   color: '#e9c176', border: 'rgba(233,193,118,0.3)' },
  'Pierwszy Raz':   { bg: 'rgba(157,78,222,0.12)',   color: '#e9c176', border: 'rgba(157,78,222,0.3)' },
  'Bez Osądu':      { bg: 'rgba(157,78,221,0.12)',  color: '#e9c176', border: 'rgba(157,78,221,0.3)' },
  'Tam i Tam':      { bg: 'rgba(255,165,0,0.12)',   color: '#FFA500', border: 'rgba(255,165,0,0.3)' },
  'Słownik':        { bg: 'rgba(0,255,150,0.12)',   color: '#00FF96', border: 'rgba(0,255,150,0.3)' },
  'Temat Miesiąca': { bg: 'rgba(255,200,0,0.12)',   color: '#FFC800', border: 'rgba(255,200,0,0.3)' },
}

const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'pierwszy-raz':   'Pierwszy Raz',
  'bez-osadu':      'Bez Osądu',
  'tam-i-tam':      'Tam i Tam',
  'slownik':        'Słownik',
  'temat-miesiaca': 'Temat Miesiąca',
}

// Inline parser: supports **bold** and [label](url) in any nesting order.
// Internal links (starting with "/") use wouter <Link> for SPA navigation;
// external links (http/https) render as <a target="_blank">.
function parseBold(text) {
  const nodes = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      const url = m[2]
      const inner = parseBold(m[1])
      if (/^https?:/i.test(url)) {
        nodes.push(<a key={`a${i}`} href={url} target="_blank" rel="noopener noreferrer">{inner}</a>)
      } else {
        nodes.push(<Link key={`a${i}`} href={url}>{inner}</Link>)
      }
    } else {
      nodes.push(<strong key={`b${i}`}>{parseBold(m[3])}</strong>)
    }
    last = re.lastIndex
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderContent(content) {
  return (content || '').trim().split('\n').map((line, i) => {
    if (line.startsWith('# '))   return <h1 key={i}>{parseBold(line.slice(2))}</h1>
    if (line.startsWith('## '))  return <h2 key={i}>{parseBold(line.slice(3))}</h2>
    if (line.startsWith('### ')) return <h3 key={i}>{parseBold(line.slice(4))}</h3>
    if (line.startsWith('- '))   return <li key={i}>{parseBold(line.slice(2))}</li>
    if (line.trim() === '')      return null
    return <p key={i}>{parseBold(line)}</p>
  })
}

// Pick onward reads: shared tags first (bridges categories), then same
// category, then whatever's left — so every article has a path forward.
function pickRelated(list, current, slug, limit = 4) {
  const meTags = Array.isArray(current.tags) ? current.tags : []
  const meCat = current.category_slug
  return (list || [])
    .filter(a => a.slug && a.slug !== slug)
    .map(a => {
      const tags = Array.isArray(a.tags) ? a.tags : []
      const overlap = meTags.filter(t => tags.includes(t)).length
      return { a, overlap, sameCat: a.category_slug === meCat ? 1 : 0 }
    })
    .sort((x, y) => (y.overlap - x.overlap) || (y.sameCat - x.sameCat) || (y.a.featured ? 1 : 0) - (x.a.featured ? 1 : 0))
    .slice(0, limit)
    .map(({ a }) => ({
      slug: a.slug,
      title: a.title,
      category: SLUG_TO_DISPLAY[a.category_slug] || a.category_slug || 'CNM 101',
      cover_image: a.cover_image || null,
      reading_time: Math.max(1, Math.ceil((a.content || '').split(/\s+/).length / 200)),
    }))
}

// Bottom CTA steered by category — points to a topically relevant section
// instead of a generic nudge.
const CTA_MAP = {
  'tam-i-tam':    { icon: '📍', title: 'Miejsca i kluby', sub: 'Zobacz sceny lifestyle w Polsce i na świecie →', href: '/miejsca' },
  'slownik':      { icon: '📖', title: 'Cały słownik CNM', sub: 'Pojęcia od compersion po polycule →', href: '/slownik' },
  'pierwszy-raz': { icon: '🎉', title: 'Najbliższe wydarzenia', sub: 'Znajdź imprezę dla par i singli →', href: '/imprezy' },
}
const CTA_DEFAULT = { icon: '📖', title: 'Słownik CNM', sub: 'Poznaj język niemonogamii i lifestyle →', href: '/slownik' }

function CtaBox({ categorySlug }) {
  const cta = CTA_MAP[categorySlug] || CTA_DEFAULT
  return (
    <Link href={cta.href} className="group flex items-center gap-4 mt-12 p-6 border border-outline-variant/20 hover:border-primary-container/40 transition-colors no-underline">
      <span className="text-3xl">{cta.icon}</span>
      <div className="min-w-0">
        <span className="block font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">{cta.title}</span>
        <span className="block font-body text-body-md text-on-surface-variant mt-1">{cta.sub}</span>
      </div>
    </Link>
  )
}

export function ArticleDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setRelated([])
      try {
        // 1. Try backend API (view increment happens server-side)
        const data = await apiFetch(`/api/articles/${slug}`)
        setArticle({
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.excerpt || '',
          category: SLUG_TO_DISPLAY[data.category_slug] || data.category_slug || 'CNM 101',
          categorySlug: data.category_slug || null,
          content: data.content || '',
          cover_image: data.cover_image || null,
          author: data.author || 'Redakcja',
          date: data.publish_date || data.created_at || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          seoTitle: data.seo_title || data.title,
          seoDescription: data.seo_description || data.excerpt || '',
          reading_time: Math.max(1, Math.ceil((data.content || '').split(/\s+/).length / 200)),
        })
        // Onward reads (client-side, no backend change).
        apiFetch('/api/articles')
          .then(list => setRelated(pickRelated(list, data, slug)))
          .catch(() => setRelated([]))
      } catch {
        // 2. Fallback to static articles
        const found = ARTICLES.find(a => a.slug === slug)
        if (found) {
          setArticle({ ...found, seoTitle: found.title, seoDescription: found.description })
          setRelated(
            ARTICLES.filter(a => a.slug !== slug && a.category === found.category)
              .concat(ARTICLES.filter(a => a.slug !== slug && a.category !== found.category))
              .slice(0, 4)
              .map(a => ({ slug: a.slug, title: a.title, category: a.category, cover_image: a.cover_image || null, reading_time: a.reading_time || Math.max(1, Math.ceil((a.content || '').split(/\s+/).length / 200)) }))
          )
        } else setArticle(null)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="font-body text-body-md text-on-surface-variant">Ładowanie…</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="bg-background min-h-screen text-on-surface">
        <Helmet>
          <title>Artykuł nie znaleziony | ExtraFun</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <main className="max-w-2xl mx-auto px-6 md:px-16 py-24 text-center">
          <p className="font-display italic text-headline-sm text-on-surface mb-6">Nie znaleziono artykułu.</p>
          <Link href="/magazyn">
            <span className="font-body text-label-caps uppercase text-primary-container cursor-pointer">← Wróć do Magazynu</span>
          </Link>
        </main>
      </div>
    )
  }

  const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']
  const canonical = `${BASE_URL}/magazyn/${article.slug || slug}`
  const ogImage = article.cover_image || `${BASE_URL}/og-default.jpg`

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>{article.seoTitle ? `${article.seoTitle} | ExtraFun` : `${article.title} | ExtraFun`}</title>
        <meta name="description" content={article.seoDescription || article.description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.seoTitle || article.title} />
        <meta property="og:description" content={article.seoDescription || article.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="ExtraFun" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seoTitle || article.title} />
        <meta name="twitter:description" content={article.seoDescription || article.description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Back bar */}
      <div className="max-w-2xl mx-auto px-6 md:px-16 pt-8">
        <Link href="/magazyn">
          <span className="font-body text-label-caps uppercase text-primary-container cursor-pointer hover:opacity-80">← Powrót</span>
        </Link>
      </div>

      {/* Hero image */}
      {article.cover_image && (
        <div className="max-w-4xl mx-auto px-6 md:px-16 mt-6">
          <img src={article.cover_image} alt={article.title} className="w-full h-auto max-h-[60vh] object-cover" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 md:px-16 pt-10 pb-24">
        <div className="flex items-center gap-3 font-body text-label-caps uppercase text-primary-container mb-5">
          <span>{article.category}</span>
          <span className="text-outline">·</span>
          <span className="text-outline">{article.reading_time} min czytania</span>
        </div>

        <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface leading-tight mb-6">{article.title}</h1>

        <div className="flex items-center gap-3 mb-10 pb-8 border-b border-outline-variant/20">
          <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="font-body text-body-md text-on-surface">{article.author}</p>
            {article.date && (
              <p className="font-body text-label-caps uppercase text-outline">
                {new Date(article.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {related[0] && (
          <Link href={`/magazyn/${related[0].slug}`} className="group flex items-baseline gap-3 mb-10 p-4 border border-outline-variant/20 hover:border-primary-container/40 transition-colors no-underline">
            <span className="font-body text-label-caps uppercase text-primary-container flex-shrink-0">Czytaj też</span>
            <span className="font-body text-body-md text-on-surface flex-1">{related[0].title}</span>
            <span className="text-primary-container">→</span>
          </Link>
        )}

        {(() => {
          const raw = (article.content || '').trim()
          const isHtml = raw.startsWith('<')
          if (isHtml) {
            return <div className="ef-art-text" dangerouslySetInnerHTML={{ __html: raw }} />
          }
          const lines = raw.split('\n')
          const body = lines[0].startsWith('# ') ? lines.slice(1) : lines
          return <div className="ef-art-text">{renderContent(body.join('\n'))}</div>
        })()}

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10">
            {article.tags.map((t, i) => (
              <span key={i} className="font-body text-label-caps uppercase text-outline border border-outline-variant/30 px-3 py-1">{t}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display italic font-medium text-headline-md text-on-surface border-b border-outline-variant/20 pb-4 mb-8">Czytaj dalej</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {related.map(r => (
                <Link key={r.slug} href={`/magazyn/${r.slug}`} className="group no-underline">
                  {r.cover_image && <img src={r.cover_image} alt="" loading="lazy" className="w-full h-44 object-cover mb-3" />}
                  <span className="block font-body text-label-caps uppercase text-primary-container">{r.category}</span>
                  <h3 className="font-display italic font-medium text-body-lg text-on-surface mt-1 group-hover:text-primary-container transition-colors">{r.title}</h3>
                  <span className="block font-body text-label-caps uppercase text-outline mt-1">{r.reading_time} min</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <CtaBox categorySlug={article.categorySlug} />
      </article>
    </div>
  )
}
