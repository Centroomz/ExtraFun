import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { getWordOfTheDay } from '../lib/dictionary'
import { apiFetch, apiFetchShared } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'
import { QUIZ_TITLE, QUIZ_INTRO } from '../lib/quiz-dogging'
import { MONTH_THEMES } from '../lib/theme-month'
import { SLUG_TO_DISPLAY } from '../lib/rubryki'
import { useImpression, trackClick } from '../lib/cardStats'
import { CardStatBadge } from './CardStatBadge'
import { coverUrl } from '../lib/images'
import { useIsDesktop } from '../hooks/useIsDesktop'

// One shared right column for every desktop content page (spec:
// docs/superpowers/specs/2026-09-17-ef-site-rail-desktop-design.md).
// Every module hides itself when it has no real data — never a placeholder.

const railBox = 'border border-outline-variant/20 p-6'
const railLabel = 'font-body text-label-caps uppercase text-primary-container mb-4'
const railLink = 'inline-block mt-4 font-body text-label-caps uppercase text-primary-container hover:opacity-80'

/* ── Article row: cover thumbnail + title (covers sell the click) ── */
function ArticleRow({ item }) {
  const ref = useImpression('article', item.id)
  return (
    <Link href={`/magazyn/${item.slug}`} ref={ref} onClick={() => { if (item.id != null) trackClick('article', item.id) }} className="group relative flex gap-3 no-underline">
      <CardStatBadge kind="article" id={item.id} className="absolute -top-1 right-0 z-10" />
      {item.cover_image && (
        <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-surface-container">
          <img src={coverUrl(item.cover_image, 160)} alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <h4 className="font-body text-body-md text-on-surface leading-snug line-clamp-3 group-hover:text-primary-container transition-colors">{item.title}</h4>
    </Link>
  )
}

function ArticleModule({ title, items }) {
  if (!items || !items.length) return null
  return (
    <section>
      <h3 className={railLabel}>{title}</h3>
      <div className="space-y-4">{items.map(i => <ArticleRow key={i.slug} item={i} />)}</div>
    </section>
  )
}

/* ── Dziś w klubach — today's dated swing events; none → module hidden ── */
function TodayEventsModule() {
  const [events, setEvents] = useState(null)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    // event_date is a timestamp ('…T00:00:00'), so `to=today` alone would exclude today.
    apiFetchShared(`/api/events?from=${today}&to=${today}T23:59:59`)
      .then(data => setEvents((data || []).filter(e => e.event_name && String(e.event_date).slice(0, 10) === today).slice(0, 5)))
      .catch(() => setEvents([]))
  }, [])
  if (!events || !events.length) return null
  return (
    <section>
      <h3 className={railLabel}>Dziś w klubach</h3>
      <ul className="space-y-4">
        {events.map(e => (
          <li key={e.id}>
            <Link href="/imprezy" className="group block no-underline">
              <div className="font-body text-body-md text-on-surface leading-snug group-hover:text-primary-container transition-colors">{e.event_name}</div>
              <div className="font-body text-body-sm text-on-surface-variant">
                {[e.venue?.name || e.location_name, e.start_time ? e.start_time.slice(0, 5) : null].filter(Boolean).join(' · ')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/imprezy" className={railLink}>Wszystkie imprezy →</Link>
    </section>
  )
}

/* ── Zeszły Temat Miesiąca — previous month's umbrella, if configured ── */
function LastThemeModule() {
  const m = new Date().getMonth() // getMonth() is 0-based → this IS last month's 1-based key
  const theme = MONTH_THEMES[m === 0 ? 12 : m]
  if (!theme || !theme.slugs?.length) return null
  const slug = theme.slugs[0]
  const name = SLUG_TO_DISPLAY[slug] || slug
  return (
    <section>
      <h3 className={railLabel}>Zeszły Temat Miesiąca</h3>
      <Link href={`/magazyn/rubryka/${slug}`} className="group block no-underline">
        {theme.image && (
          <div className="aspect-[16/9] overflow-hidden bg-surface-container mb-3">
            <img src={coverUrl(theme.image, 800)} alt="" loading="lazy" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="font-display italic font-medium text-headline-sm text-on-surface leading-tight group-hover:text-primary-container transition-colors">{name}</div>
        <p className="font-body text-body-sm text-on-surface-variant mt-1 line-clamp-2">{theme.lead}</p>
      </Link>
    </section>
  )
}

/* ── Słówko dnia ── */
function WordModule() {
  const word = getWordOfTheDay()
  if (!word) return null
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

/* ── Quiz miesiąca — same module on every page. Magazyn opens the quiz in place
   (onStartQuiz); elsewhere the button routes to /magazyn?quiz=1. ── */
function QuizModule({ onStartQuiz, quizDone }) {
  const [, navigate] = useLocation()
  const done = quizDone ?? (() => { try { return localStorage.getItem('ef_quiz_dogging_done') === '1' } catch { return false } })()
  if (done) return null
  const start = onStartQuiz || (() => navigate('/magazyn?quiz=1'))
  return (
    <button
      onClick={start}
      className="group w-full text-left p-6 border border-primary-container/25"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))' }}
    >
      <div className={railLabel}>Quiz miesiąca</div>
      <div className="font-display text-headline-sm text-on-surface mb-2 leading-tight">{QUIZ_TITLE}</div>
      <p className="font-body text-body-sm text-on-surface-variant mb-4">{QUIZ_INTRO}</p>
      <span className="font-body text-label-caps uppercase text-primary-container group-hover:translate-x-1 transition-transform inline-block">Zacznij →</span>
    </button>
  )
}

/* ── Miejsca blisko — GPS when granted, otherwise Warsaw ── */
function NearbyModule() {
  const [venues, setVenues] = useState(null)
  const { location, error, loading, requestLocation } = useGeolocation()

  useEffect(() => {
    apiFetchShared('/api/places')
      // ExtraFun "kluby": drop naturist beaches (own /plaze page) and gay-scene
      // venues (gay.pl) — otherwise the 66 gay beaches bury the ~13 swing clubs.
      .then(data => setVenues((data || []).filter(v => v.name && v.type !== 'plaża' && v.scene !== 'gay')))
      .catch(() => setVenues([]))
  }, [])

  if (!venues || venues.length === 0) return null

  const withGps = venues.filter(v => v.lat && v.lng)
  const warsaw = venues.filter(v => (v.city || '').toLowerCase().startsWith('warszaw'))
  const list = location
    ? sortByDistance(withGps, location.lat, location.lng).slice(0, 4)
    : [...warsaw].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 4)
  if (!list.length) return null

  return (
    <div className={railBox}>
      <div className={railLabel}>{location ? 'Miejsca blisko' : 'Miejsca · Warszawa'}</div>
      {!location && (
        <button
          onClick={requestLocation}
          disabled={loading}
          className="font-body text-body-sm text-primary-container hover:opacity-80 block mb-4 disabled:opacity-50"
        >
          {loading ? 'Szukam pozycji…' : '📍 Pokaż najbliższe mnie'}
        </button>
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

const toRow = (a) => ({ id: a.id, slug: a.slug, title: a.title, cover_image: a.cover_image || null })

/**
 * Shared right column.
 * @param {object[]} [related]   article page only — "Powiązane" rows
 * @param {string}   [exclude]   slug of the current article (dropped from popular/newest)
 * @param {function} [onStartQuiz] Magazyn only — opens the quiz in place (elsewhere it links to /magazyn?quiz=1)
 * @param {boolean}  [quizDone]
 */
export function SiteRail({ related = [], exclude = null, onStartQuiz, quizDone }) {
  // Desktop-only by mount, not by CSS: `hidden lg:block` still ran every
  // module's useEffect on phones (3 API calls + 11 covers for nothing).
  const isDesktop = useIsDesktop()
  const [articles, setArticles] = useState([])
  useEffect(() => {
    if (!isDesktop) return
    apiFetchShared('/api/articles')
      .then(data => setArticles((data || []).filter(a => a.slug && a.title)))
      .catch(() => setArticles([]))
  }, [isDesktop])

  const pool = exclude ? articles.filter(a => a.slug !== exclude) : articles
  const popular = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(toRow)
  const newest = [...pool]
    .sort((a, b) => new Date(b.publish_date || b.created_at || 0) - new Date(a.publish_date || a.created_at || 0))
    .slice(0, 5).map(toRow)

  if (!isDesktop) return null

  return (
    <div className="space-y-10">
      <QuizModule onStartQuiz={onStartQuiz} quizDone={quizDone} />
      <ArticleModule title="Powiązane" items={related.map(toRow)} />
      <ArticleModule title="Najczęściej czytane" items={popular} />
      <ArticleModule title="Najnowsze" items={newest} />
      <TodayEventsModule />
      <LastThemeModule />
      <NearbyModule />
      <WordModule />
    </div>
  )
}
