import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { getWordOfTheDay } from '../lib/dictionary'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'
import { QUIZ_TITLE, QUIZ_INTRO } from '../lib/quiz-dogging'

// Deterministic day index — same scheme as getWordOfTheDay, so the rotating
// picks below change once a day and stay stable within the day.
function dayOfYear() {
  return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
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

/* ── Quiz miesiąca (desktop sidebar, na górze; mobile ma własne CTA nad hero) ── */
function QuizModule({ onStartQuiz, quizDone }) {
  if (quizDone || !onStartQuiz) return null
  return (
    <button
      onClick={onStartQuiz}
      className="hidden lg:block group w-full text-left p-6 border border-primary-container/25"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))' }}
    >
      <div className="text-4xl mb-3">🌙</div>
      <div className={railLabel}>Quiz miesiąca</div>
      <div className="font-display text-headline-sm text-on-surface mb-2 leading-tight">{QUIZ_TITLE}</div>
      <p className="font-body text-body-sm text-on-surface-variant mb-4">{QUIZ_INTRO}</p>
      <span className="font-body text-label-caps uppercase text-primary-container group-hover:translate-x-1 transition-transform inline-block">Zacznij →</span>
    </button>
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

export function MagazynSidebar({ onStartQuiz, quizDone }) {
  return (
    <div className="space-y-8">
      <QuizModule onStartQuiz={onStartQuiz} quizDone={quizDone} />
      <WordModule />
      <PopularModule />
      <NearbyModule />
    </div>
  )
}
