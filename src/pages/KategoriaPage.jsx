import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { MagCard, MagSectionHeader } from '../components/MagCard'
import { SLUG_TO_DISPLAY, RUBRYKA_GROUPS } from '../lib/rubryki'
import { getMonthTheme } from '../lib/theme-month'
import { PageWithRail } from '../components/PageWithRail'

const BASE_URL = 'https://www.extrafun.pl'

function estimateReadingTime(content) {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200))
}

// Resolve a route slug into { label, slugs[] }.
//   'temat'  → current monthly theme slugs
//   group    → RUBRYKA_GROUPS (e.g. 'wiedza')
//   single   → one category_slug
function resolveRubryka(param) {
  if (param === 'temat') {
    const theme = getMonthTheme()
    const slugs = theme?.slugs || []
    const name = SLUG_TO_DISPLAY[slugs[0]] || ''
    return { label: name ? `Temat Miesiąca · ${name}` : 'Temat Miesiąca', slugs }
  }
  if (RUBRYKA_GROUPS[param]) return RUBRYKA_GROUPS[param]
  return { label: SLUG_TO_DISPLAY[param] || param, slugs: [param] }
}

export function KategoriaPage({ slug }) {
  const [, navigate] = useLocation()
  const [articles, setArticles] = useState(null)
  const { label, slugs } = resolveRubryka(slug)

  useEffect(() => {
    apiFetch('/api/articles')
      .then(data => {
        const list = (data || [])
          .filter(a => slugs.includes(a.category_slug))
          .sort((a, b) => new Date(b.publish_date || b.created_at || 0) - new Date(a.publish_date || a.created_at || 0))
          .map(a => ({
            id: a.id,
            slug: a.slug || `artykul-${a.id}`,
            title: a.title,
            description: a.excerpt || '',
            category: SLUG_TO_DISPLAY[a.category_slug] || a.category_slug,
            reading_time: estimateReadingTime(a.content),
            cover_image: a.cover_image || null,
          }))
        setArticles(list)
      })
      .catch(() => setArticles([]))
  }, [slug])

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>{label} | ExtraFun</title>
        <link rel="canonical" href={`${BASE_URL}/magazyn/rubryka/${slug}`} />
      </Helmet>

      <main className="max-w-container-max mx-auto px-6 md:px-16 py-12 pb-24">
        <PageWithRail>
        <Link href="/magazyn" className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface inline-block mb-8">← Magazyn</Link>

        <MagSectionHeader label={label} />

        {articles === null ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display text-headline-sm text-on-surface mb-2">Brak artykułów</div>
            <div className="font-body text-body-md text-on-surface-variant">W tej rubryce nie ma jeszcze żadnych artykułów.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {articles.map(a => (
              <MagCard
                key={a.id}
                id={a.id}
                image={a.cover_image}
                tag={a.category}
                title={a.title}
                lead={a.description}
                meta={`${a.reading_time} min`}
                size="sm"
                onClick={() => navigate(`/magazyn/${a.slug}`)}
              />
            ))}
          </div>
        )}
      </PageWithRail>
      </main>
    </div>
  )
}
