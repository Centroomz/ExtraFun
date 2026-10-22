import { useState, useEffect, useMemo } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetchShared } from '../lib/api'
import { DICTIONARY_TERMS } from '../lib/dictionary'

// Wyszukiwarka całego serwisu: artykuły, miejsca, słownik, ogłoszenia, imprezy.
// Filtrowanie po stronie klienta na danych, które i tak serwują istniejące
// endpointy (bez nowego backendu). Katalog profili jest pod /profile.

const norm = (s) => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const LIMIT = 6

const groupLabel = 'font-body text-label-caps uppercase text-primary-container mb-4'

function Group({ label, items }) {
  if (!items.length) return null
  return (
    <section className="mb-10">
      <h2 className={groupLabel}>{label}</h2>
      <ul className="space-y-4">
        {items.map(i => (
          <li key={i.key}>
            <Link href={i.href} className="group block no-underline">
              <div className="font-body text-body-md text-on-surface leading-snug group-hover:text-primary-container transition-colors">{i.title}</div>
              {i.sub && <div className="font-body text-body-sm text-on-surface-variant line-clamp-2">{i.sub}</div>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Szukaj() {
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const [data, setData] = useState(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
    const safe = (p) => apiFetchShared(p).catch(() => [])
    Promise.all([
      safe('/api/articles'), safe('/api/places'), safe('/api/ads'),
      safe(`/api/events?from=${today}&to=${to}T23:59:59`),
    ]).then(([articles, places, ads, events]) => setData({ articles, places, ads, events }))
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q')
    window.history.replaceState(null, '', url)
  }, [q])

  const results = useMemo(() => {
    const n = norm(q).trim()
    if (n.length < 2 || !data) return null
    const has = (...f) => f.some(x => norm(x).includes(n))
    return {
      articles: (data.articles || []).filter(a => a.slug && has(a.title, a.excerpt, a.content_preview)).slice(0, LIMIT)
        .map(a => ({ key: a.id, href: `/magazyn/${a.slug}`, title: a.title, sub: a.excerpt })),
      places: (data.places || []).filter(v => v.type !== 'plaża' && has(v.name, v.city, v.description)).slice(0, LIMIT)
        .map(v => ({ key: v.id, href: `/miejsca/${v.id}-${slugify(`${v.name} ${v.city}`)}`, title: v.name, sub: v.city })),
      terms: DICTIONARY_TERMS.filter(t => has(t.term, t.definition)).slice(0, LIMIT)
        .map(t => ({ key: t.slug, href: `/slownik/${t.slug}`, title: t.term, sub: t.definition })),
      events: (data.events || []).filter(e => e.event_name && has(e.event_name, e.location_name, e.description)).slice(0, LIMIT)
        .map(e => ({ key: e.id, href: '/imprezy', title: e.event_name, sub: [String(e.event_date).slice(0, 10), e.location_name].filter(Boolean).join(' · ') })),
      ads: (data.ads || []).filter(a => has(a.title, a.description, a.city)).slice(0, LIMIT)
        .map(a => ({ key: a.id, href: '/ogloszenia', title: a.title, sub: a.city })),
    }
  }, [q, data])

  const total = results ? Object.values(results).reduce((s, r) => s + r.length, 0) : 0

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Szukaj | ExtraFun</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="max-w-5xl mx-auto px-6 md:px-16 pt-8 pb-24">
        <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-tight mb-6">Szukaj</h1>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Artykuły, kluby, imprezy, słownik, ogłoszenia…"
          className="w-full bg-transparent border border-outline-variant/20 px-4 py-3 font-body text-body-md text-on-surface mb-10"
        />
        {!data && <p className="font-body text-body-md text-on-surface-variant">Ładowanie…</p>}
        {data && !results && <p className="font-body text-body-md text-on-surface-variant">Wpisz co najmniej 2 znaki.</p>}
        {results && total === 0 && <p className="font-body text-body-md text-on-surface-variant">Brak wyników dla „{q}".</p>}
        {results && (
          <>
            <Group label="Artykuły" items={results.articles} />
            <Group label="Miejsca" items={results.places} />
            <Group label="Imprezy" items={results.events} />
            <Group label="Słownik" items={results.terms} />
            <Group label="Ogłoszenia" items={results.ads} />
          </>
        )}
        <Link href="/profile" className="font-body text-label-caps uppercase text-primary-container hover:opacity-80">Szukasz osoby? Katalog profili →</Link>
      </main>
    </div>
  )
}
