import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Hero } from '../components/nocturne'

const BASE_URL = 'https://extrafun.pl'
const ADMIN_EMAILS = ['pinksservice@gmail.com', 'kingaa.kaczynska@gmail.com']

const isForeign = (n) => n.region === 'International' || n.lang === 'en'

// Module-level translation cache (survives route changes within a session).
const trCache = new Map() // text -> translated

async function translate(text) {
  if (!text) return text
  if (trCache.has(text)) return trCache.get(text)
  try {
    const r = await fetch('/api/translate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'PL', source: 'English' }),
    })
    if (!r.ok) return text
    const d = await r.json()
    const out = d.translated || text
    trCache.set(text, out)
    return out
  } catch { return text }
}

function timeAgo(d) {
  if (!d) return ''
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'przed chwilą'
  if (h < 24) return `${h} h temu`
  return `${Math.floor(h / 24)} dni temu`
}

const firstSentence = (s) => (s ? s.split(/(?<=[.!?])\s/)[0] : '')
const hasImg = (n) => !!n.image && n.image !== '/icon-192.png'

function SourceTile({ source }) {
  const hue = [...(source || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-3 text-center"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 22%), hsl(${hue} 45% 12%))` }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Źródło</span>
      <span className="font-bold text-white leading-tight" style={{ fontSize: 'clamp(14px, 3.5vw, 20px)' }}>{source}</span>
    </div>
  )
}

export function Aktualnosci() {
  const { user } = useAuth()
  const isAdmin = ADMIN_EMAILS.includes(user?.email)
  const [news, setNews] = useState(null)
  const [filter, setFilter] = useState('all')
  const [tr, setTr] = useState({}) // id -> { title, lead }

  const load = () => {
    apiFetch('/api/news').then(setNews).catch(() => setNews([]))
  }
  useEffect(() => { load() }, [])

  // Translate foreign (EN) titles + leads to Polish, once per item.
  useEffect(() => {
    if (!news) return
    let cancelled = false
    ;(async () => {
      for (const n of news) {
        if (!isForeign(n) || tr[n.id]) continue
        const [title, lead] = await Promise.all([translate(n.title), translate(firstSentence(n.summary))])
        if (cancelled) return
        setTr(prev => ({ ...prev, [n.id]: { title, lead } }))
      }
    })()
    return () => { cancelled = true }
  }, [news])

  const titleOf = (n) => (isForeign(n) ? (tr[n.id]?.title || n.title) : n.title)
  const leadOf = (n) => (isForeign(n) ? (tr[n.id]?.lead || firstSentence(n.summary)) : n.summary)
  const readLabel = (n) => `Czytaj ${isForeign(n) ? 'po angielsku ' : ''}na ${n.source}`

  async function pin(n) {
    await apiFetch(`/api/admin/news/${n.id}/pin`, { method: 'PATCH', body: { pinned: !n.pinned } })
    load()
  }
  async function remove(n) {
    await apiFetch(`/api/admin/news/${n.id}`, { method: 'DELETE' })
    load()
  }

  const all = news ?? []
  const counts = {
    all: all.length,
    Polska: all.filter(n => n.region === 'Polska').length,
    International: all.filter(n => n.region === 'International').length,
  }
  const list = filter === 'all' ? all : all.filter(n => n.region === filter)

  const AdminBtns = ({ n }) => isAdmin ? (
    <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
      <button onClick={() => pin(n)} title={n.pinned ? 'Odepnij' : 'Przypnij'}
        className="px-2 py-1 rounded bg-black/60 text-white text-xs hover:bg-black/80">{n.pinned ? '📌' : 'pin'}</button>
      <button onClick={() => remove(n)} title="Usuń"
        className="px-2 py-1 rounded bg-black/60 text-red-300 text-xs hover:bg-black/80">usuń</button>
    </div>
  ) : null

  const Card = ({ n }) => (
    <a href={n.url} target="_blank" rel="noopener noreferrer"
      className={`relative block border ${n.pinned ? 'border-primary-container' : 'border-outline-variant/20'} overflow-hidden group hover:border-primary-container/60 transition-colors`}>
      <AdminBtns n={n} />
      <div className="aspect-[16/9] bg-surface-variant/30 overflow-hidden">
        {hasImg(n)
          ? <img src={n.image} alt="" loading="lazy" className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }} />
          : <SourceTile source={n.source} />}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap font-body text-label-caps uppercase">
          {n.pinned && <span className="text-primary-container">📌 Przypięte</span>}
          <span className="text-on-surface-variant">{n.source}</span>
          <span className="text-on-surface-variant/60">· {timeAgo(n.publishedAt)}</span>
        </div>
        <h3 className="font-display text-headline-sm text-on-surface leading-snug line-clamp-3">{titleOf(n)}</h3>
        {leadOf(n) && <p className="font-body text-body-md text-on-surface-variant mt-2 line-clamp-2">{leadOf(n)}</p>}
        <span className="inline-block mt-3 font-body text-label-caps uppercase text-primary-container">{readLabel(n)} →</span>
      </div>
    </a>
  )

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Aktualności – swing, poliamoria, fetysz | ExtraFun</title>
        <meta name="description" content="Najnowsze wiadomości ze świata swingu, konsensualnej niemonogamii, poliamorii i fetyszu — przegląd z zaufanych źródeł, po polsku." />
        <link rel="canonical" href={`${BASE_URL}/aktualnosci`} />
        <meta property="og:title" content="Aktualności – ExtraFun" />
        <meta property="og:description" content="Świeże newsy o swingu, CNM, poliamorii i fetyszu." />
        <meta property="og:url" content={`${BASE_URL}/aktualnosci`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ExtraFun" />
      </Helmet>

      <Hero
        image="/editorial/hero-magazyn.jpg"
        label="AKTUALNOŚCI"
        title="Świeże wiadomości"
        lead="Swing, poliamoria, CNM i fetysz — przegląd z zaufanych źródeł, codziennie odświeżany."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {all.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-12">
            {[['all', 'Wszystko'], ['Polska', 'Polska'], ['International', 'Świat']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
                  filter === key ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}>
                {label} <span className="opacity-60">{counts[key]}</span>
              </button>
            ))}
          </div>
        )}

        {news === null ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : list.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display text-headline-sm text-on-surface mb-2">Newsy pojawią się wkrótce</div>
            <div className="font-body text-body-md text-on-surface-variant">Pobieramy je co pół godziny z zaufanych źródeł.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {list.map(n => <Card key={n.id} n={n} />)}
          </div>
        )}
      </main>
    </div>
  )
}
