import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { getWordOfTheDay } from '../lib/dictionary'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'

// Deterministic day index — same scheme as getWordOfTheDay, so the rotating
// picks below change once a day and stay stable within the day.
function dayOfYear() {
  return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
}

// Monthly theme. Only months with a REAL editorial theme live here; any other
// month → module hidden (no placeholder). Keep in sync with the Magazyn hero.
const MONTH_THEMES = {
  7: { label: 'Lipiec · Nagie plaże', title: 'Skóra, słońce, woda.', lead: 'Naturyzm i lifestyle nad polską wodą.' },
  8: { label: 'Sierpień · Nagie plaże', title: 'Skóra, słońce, woda.', lead: 'Naturyzm i lifestyle nad polską wodą.' },
  9: { label: 'Wrzesień · Dogging', title: 'Las, Wisła, parking.', lead: 'Plenerowa scena: prawo, savoir-vivre i dlaczego krzaki zamiast klubu.' },
}

const railBox = 'border border-outline-variant/20 p-6'
const railLabel = 'font-body text-label-caps uppercase text-primary-container mb-3'
const railLink = 'inline-block mt-4 font-body text-label-caps uppercase text-primary-container hover:opacity-80'

/* ── Słówko dnia ───────────────────────────────────────────────── */
function WordModule() {
  const word = getWordOfTheDay()
  const def = word.definition.length > 180 ? word.definition.slice(0, 180).trimEnd() + '…' : word.definition
  return (
    <div className={railBox}>
      <div className={railLabel}>Słówko dnia</div>
      <Link href={`/slownik/${word.slug}`} className="font-display text-headline-sm text-on-surface mb-2 block hover:opacity-80">{word.term}</Link>
      <p className="font-body text-body-md text-on-surface-variant">{def}</p>
      <Link href="/slownik" className={railLink}>Cały słownik →</Link>
    </div>
  )
}

/* ── Skrót popularnych — 3 stałe najczęściej czytane + 2 rotacja ── */
function PopularModule() {
  const [items, setItems] = useState(null)
  useEffect(() => {
    apiFetch('/api/articles')
      .then(data => {
        const sorted = (data || [])
          .filter(a => a.slug && a.title)
          .sort((a, b) => (b.views || 0) - (a.views || 0))
        const top3 = sorted.slice(0, 3)
        const pool = sorted.slice(3)
        const rot = []
        if (pool.length) {
          const i1 = dayOfYear() % pool.length
          rot.push(pool[i1])
          if (pool.length > 1) {
            let i2 = (dayOfYear() * 7 + 3) % pool.length
            if (i2 === i1) i2 = (i2 + 1) % pool.length
            rot.push(pool[i2])
          }
        }
        setItems([...top3, ...rot])
      })
      .catch(() => setItems([]))
  }, [])

  if (!items || items.length === 0) return null
  return (
    <div className={railBox}>
      <div className={railLabel}>Najczęściej czytane</div>
      <ol className="space-y-4">
        {items.map((a, i) => (
          <li key={a.id} className="flex gap-3">
            <span className="font-display text-headline-sm text-primary-container/50 leading-none w-6 shrink-0">{i + 1}</span>
            <Link href={`/magazyn/${a.slug}`} className="font-body text-body-md text-on-surface hover:text-primary-container leading-snug">{a.title}</Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Temat miesiąca ────────────────────────────────────────────── */
function ThemeModule({ onSelectCategory }) {
  const theme = MONTH_THEMES[new Date().getMonth() + 1]
  if (!theme) return null
  return (
    <div className={railBox} style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02))' }}>
      <div className={railLabel}>Temat miesiąca</div>
      <div className="font-display text-headline-sm text-on-surface mb-1">{theme.title}</div>
      <div className="font-body text-body-sm text-primary-container mb-2">{theme.label}</div>
      <p className="font-body text-body-md text-on-surface-variant">{theme.lead}</p>
      <button
        onClick={() => { onSelectCategory && onSelectCategory('Temat Miesiąca'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        className={railLink}
      >
        Zobacz numer →
      </button>
    </div>
  )
}

/* ── Miejsca blisko Ciebie ─────────────────────────────────────── */
function NearbyModule() {
  const [venues, setVenues] = useState(null)
  const { location, error, loading, requestLocation } = useGeolocation()

  useEffect(() => {
    apiFetch('/api/places')
      // ExtraFun "kluby": drop naturist beaches (own /plaze page) and gay-scene
      // venues (gay.pl) — otherwise the 66 gay beaches bury the ~13 swing clubs.
      .then(data => setVenues((data || []).filter(v => v.name && v.type !== 'plaża' && v.scene !== 'gay')))
      .catch(() => setVenues([]))
  }, [])

  if (!venues || venues.length === 0) return null

  // PL bounding box — default (no geolocation) shows Polish clubs, never a
  // featured venue abroad (Amsterdam/Barcelona etc. also live in this table).
  const inPoland = (v) => {
    const la = Number(v.lat), ln = Number(v.lng)
    return la >= 49 && la <= 55 && ln >= 14 && ln <= 24.3
  }
  const withGps = venues.filter(v => v.lat && v.lng)
  const plVenues = withGps.filter(inPoland)
  const base = plVenues.length ? plVenues : withGps
  const list = location
    ? sortByDistance(withGps, location.lat, location.lng).slice(0, 4)
    : [...base].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 4)

  return (
    <div className={railBox}>
      <div className={railLabel}>Miejsca blisko</div>
      {!location && (
        <div className="mb-4">
          <div className="font-body text-body-sm text-on-surface-variant mb-2">Popularne kluby w Polsce</div>
          <button
            onClick={requestLocation}
            disabled={loading}
            className="font-body text-body-sm text-primary-container hover:opacity-80 block disabled:opacity-50"
          >
            {loading ? 'Szukam pozycji…' : '📍 Pokaż najbliższe mnie'}
          </button>
        </div>
      )}
      {error && <p className="font-body text-body-sm text-on-surface-variant/70 mb-3">{error}</p>}
      <ul className="space-y-3">
        {list.map(v => (
          <li key={v.id} className="flex justify-between items-baseline gap-3">
            <div className="min-w-0">
              <div className="font-body text-body-md text-on-surface truncate">{v.name}</div>
              <div className="font-body text-body-sm text-on-surface-variant">{v.city}</div>
            </div>
            {v.distance != null && (
              <span className="font-body text-body-sm text-primary-container whitespace-nowrap">{formatDistance(v.distance)}</span>
            )}
          </li>
        ))}
      </ul>
      <Link href="/miejsca" className={railLink}>Wszystkie miejsca →</Link>
    </div>
  )
}

export function MagazynSidebar({ onSelectCategory }) {
  return (
    <div className="space-y-8">
      <WordModule />
      <PopularModule />
      <ThemeModule onSelectCategory={onSelectCategory} />
      <NearbyModule />
    </div>
  )
}
