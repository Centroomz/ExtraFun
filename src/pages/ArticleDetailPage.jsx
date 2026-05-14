import { useState, useEffect } from 'react'
import { useParams, Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { ARTICLES } from '../lib/articles'

const BASE_URL = 'https://extrafun.pl'

const CATEGORY_COLORS = {
  'CNM 101':        { bg: 'rgba(0,229,255,0.12)',   color: '#00E5FF', border: 'rgba(0,229,255,0.3)' },
  'Pierwszy Raz':   { bg: 'rgba(255,0,128,0.12)',   color: '#FF0080', border: 'rgba(255,0,128,0.3)' },
  'Bez Osądu':      { bg: 'rgba(157,78,221,0.12)',  color: '#9D4EDD', border: 'rgba(157,78,221,0.3)' },
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

export function ArticleDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1. Try Supabase
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, content, category_slug, cover_image, featured, seo_title, seo_description')
        .eq('site', 'extrafun')
        .eq('status', 'published')
        .eq('slug', slug)
        .single()

      if (data) {
        setArticle({
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.excerpt || '',
          category: SLUG_TO_DISPLAY[data.category_slug] || data.category_slug || 'CNM 101',
          content: data.content || '',
          cover_image: data.cover_image || null,
          seoTitle: data.seo_title || data.title,
          seoDescription: data.seo_description || data.excerpt || '',
          reading_time: Math.max(1, Math.ceil((data.content || '').split(/\s+/).length / 200)),
        })
      } else {
        // 2. Fallback to static articles
        const found = ARTICLES.find(a => a.slug === slug)
        if (found) setArticle({ ...found, seoTitle: found.title, seoDescription: found.description })
        else setArticle(null)
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
        <span className="article-card-tag" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
          {article.category}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{article.reading_time} min czytania</span>
      </div>

      {/* Hero image */}
      {article.cover_image && (
        <div className="mag-article-hero">
          <img src={article.cover_image} alt={article.title} />
          <div className="mag-article-hero-overlay" />
        </div>
      )}

      {/* Content */}
      <div className="mag-article-body">
        <div className="article-detail">
          {renderContent(article.content)}
        </div>
      </div>
    </div>
  )
}
