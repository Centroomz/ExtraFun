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

function parseBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
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
    <Link href={cta.href} className="ef-art-cta">
      <span className="ef-art-cta-icon">{cta.icon}</span>
      <div className="ef-art-cta-body">
        <span className="ef-art-cta-title">{cta.title}</span>
        <span className="ef-art-cta-sub">{cta.sub}</span>
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
      <div className="mag-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="mag-root" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <Helmet>
          <title>Artykuł nie znaleziony | ExtraFun</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Nie znaleziono artykułu.</p>
        <Link href="/magazyn">
          <button className="btn-ghost">← Wróć do Magazynu</button>
        </Link>
      </div>
    )
  }

  const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']
  const canonical = `${BASE_URL}/magazyn/${article.slug || slug}`
  const ogImage = article.cover_image || `${BASE_URL}/og-default.jpg`

  return (
    <div className="mag-root">
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
      <div className="mag-article-bar">
        <Link href="/magazyn">
          <button className="mag-back-btn">← Powrót</button>
        </Link>
      </div>

      {/* Hero image */}
      {article.cover_image && (
        <div className="ef-art-hero">
          <img src={article.cover_image} alt={article.title} />
        </div>
      )}

      {/* Article */}
      <article className={`ef-art-wrap${article.cover_image ? ' ef-art-wrap--overlap' : ''}`}>
        <div className="ef-art-meta-top">
          <span className="ef-art-chip">{article.category}</span>
          <span className="ef-art-dot" />
          <span>{article.reading_time} MIN CZYTANIA</span>
        </div>

        <h1 className="ef-art-title">{article.title}</h1>

        <div className="ef-art-author">
          <div className="ef-art-author-av">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="ef-art-author-name">{article.author}</p>
            {article.date && (
              <p className="ef-art-author-date">
                {new Date(article.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
            )}
          </div>
        </div>

        {related[0] && (
          <Link href={`/magazyn/${related[0].slug}`} className="ef-art-teaser">
            <span className="ef-art-teaser-label">Czytaj też</span>
            <span className="ef-art-teaser-title">{related[0].title}</span>
            <span className="ef-art-teaser-arrow">→</span>
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
          <div className="ef-art-tags">
            {article.tags.map((t, i) => (
              <span key={i} className="ef-art-tag">{t}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="ef-art-related">
            <h2 className="ef-art-related-head">Czytaj dalej</h2>
            <div className="ef-art-related-grid">
              {related.map(r => (
                <Link key={r.slug} href={`/magazyn/${r.slug}`} className="ef-art-related-card">
                  {r.cover_image && <img src={r.cover_image} alt="" loading="lazy" />}
                  <div className="ef-art-related-body">
                    <span className="ef-art-related-cat">{r.category}</span>
                    <h3 className="ef-art-related-title">{r.title}</h3>
                    <span className="ef-art-related-meta">{r.reading_time} min</span>
                  </div>
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
