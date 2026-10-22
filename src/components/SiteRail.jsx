import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { getWordOfTheDay } from '../lib/dictionary'
import { apiFetch, apiFetchShared } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { calculateDistance } from '../lib/geo'
import { getMonthQuiz, quizDoneKey } from '../lib/quiz-month'
import { getPastThemes } from '../lib/theme-month'
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

/* ── Zeszły Temat Miesiąca — past months' umbrellas, if configured.
   Each gets its own cover, same treatment as the current hero, while the
   list is short. Once there are many months, switch older ones to
   text-only links instead of growing a wall of covers. ── */
function LastThemeModule() {
  const past = getPastThemes()
  if (!past.length) return null
  // Two consecutive months can share one theme (e.g. Lipiec+Sierpień both
  // Plażing) — same slug, same link, so only list it once.
  const seen = new Set()
  const themes = past.filter(t => {
    const slug = t.slugs[0]
    if (seen.has(slug)) return false
    seen.add(slug)
    return true
  })
  return (
    <section>
      <h3 className={railLabel}>Zeszły Temat Miesiąca</h3>
      <div className="space-y-6">
        {themes.map(t => {
          const slug = t.slugs[0]
          const name = SLUG_TO_DISPLAY[slug] || slug
          return (
            <Link key={slug} href={`/magazyn/rubryka/${slug}`} className="group block no-underline">
              {t.image && (
                <div className="aspect-[16/9] overflow-hidden bg-surface-container mb-3">
                  <img src={coverUrl(t.image, 800)} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="font-display italic font-medium text-headline-sm text-on-surface leading-tight group-hover:text-primary-container transition-colors">{name}</div>
              <p className="font-body text-body-sm text-on-surface-variant mt-1 line-clamp-2">{t.lead}</p>
            </Link>
          )
        })}
      </div>
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
  const quiz = getMonthQuiz()
  if (!quiz) return null
  const done = quizDone ?? (() => { try { return localStorage.getItem(quizDoneKey(quiz)) === '1' } catch { return false } })()
  if (done) return null
  const start = onStartQuiz || (() => navigate('/magazyn?quiz=1'))
  return (
    <button
      onClick={start}
      className="group w-full text-left p-6 border border-primary-container/25"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))' }}
    >
      <div className={railLabel}>Quiz miesiąca</div>
      <div className="font-display text-headline-sm text-on-surface mb-2 leading-tight">{quiz.title}</div>
      <p className="font-body text-body-sm text-on-surface-variant mb-4">{quiz.intro}</p>
      <span className="font-body text-label-caps uppercase text-primary-container group-hover:translate-x-1 transition-transform inline-block">Zacznij →</span>
    </button>
  )
}

/* ── Ogłoszenia: liczba z ostatniego miesiąca + 5 najnowszych tytułów ── */
function AdsModule({ ads }) {
  if (!ads || !ads.latest.length) return null
  return (
    <section>
      <h3 className={railLabel}>Ogłoszenia · {ads.count} w tym miesiącu</h3>
      <ul className="space-y-3">
        {ads.latest.map(a => (
          <li key={a.id}>
            <Link href="/ogloszenia" className="font-body text-body-md text-on-surface leading-snug line-clamp-2 no-underline hover:text-primary-container transition-colors">{a.title}</Link>
          </li>
        ))}
      </ul>
      <Link href="/ogloszenia" className={railLink}>Wszystkie ogłoszenia →</Link>
    </section>
  )
}

/* ── Imprezy w pobliżu: miasto z GPS albo z wyboru (zapamiętane), do 30 km.
   Brak imprez w zasięgu → najbliższe w innych miastach z datą i miastem.
   Brak wybranego miasta → tylko pastylka wyboru, żadnych zgadniętych imprez. ── */
const NEAR_KM = 30
const CITY_KEY = 'ef_city'
const fmtDay = (d) => new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })

function readCity() { try { return JSON.parse(localStorage.getItem(CITY_KEY)) } catch { return null } }

function NearbyEventsModule() {
  const [events, setEvents] = useState(null)
  const [venues, setVenues] = useState([])
  const [pick, setPick] = useState(readCity())
  const { location, loading, error, requestLocation } = useGeolocation()

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const to = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10)
    Promise.all([
      apiFetchShared(`/api/events?from=${today}&to=${to}T23:59:59`),
      apiFetchShared('/api/places'),
    ]).then(([ev, pl]) => {
      setEvents((ev || []).filter(e => e.event_name))
      setVenues((pl || []).filter(v => v.lat && v.lng && v.type !== 'plaża'))
    }).catch(() => setEvents([]))
  }, [])

  useEffect(() => {
    if (!location) return
    const c = { lat: location.lat, lng: location.lng, label: 'Twoja okolica' }
    setPick(c)
    try { localStorage.setItem(CITY_KEY, JSON.stringify(c)) } catch {}
  }, [location])

  if (!events) return null
  const venueOf = (e) => venues.find(v => v.id === e.venue_id || v.legacy_swing_id === e.venue_id)
  const cities = [...new Set(events.map(e => venueOf(e)?.city).filter(Boolean))].sort()
  if (!cities.length) return null

  const choose = (city) => {
    const vs = venues.filter(v => v.city === city)
    if (!vs.length) return
    const c = { lat: parseFloat(vs[0].lat), lng: parseFloat(vs[0].lng), label: city }
    setPick(c)
    try { localStorage.setItem(CITY_KEY, JSON.stringify(c)) } catch {}
  }

  const withDist = pick ? events.map(e => {
    const v = venueOf(e)
    return { ...e, _city: v?.city, _km: v ? calculateDistance(pick.lat, pick.lng, parseFloat(v.lat), parseFloat(v.lng)) : null }
  }).filter(e => e._km != null) : []
  const near = withDist.filter(e => e._km <= NEAR_KM).slice(0, 5)
  const list = near.length ? near : [...withDist].sort((a, b) => a._km - b._km).slice(0, 3)

  return (
    <section>
      <h3 className={railLabel}>Imprezy w pobliżu</h3>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={cities.includes(pick?.label) ? pick.label : ''}
          onChange={e => choose(e.target.value)}
          className="font-body text-body-sm text-on-surface bg-transparent border border-outline-variant/20 px-3 py-1"
        >
          <option value="" className="bg-surface">{pick && !cities.includes(pick.label) ? pick.label : 'Wybierz miasto'}</option>
          {cities.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
        </select>
        <button onClick={requestLocation} disabled={loading} className="font-body text-body-sm text-primary-container hover:opacity-80 disabled:opacity-50">
          {loading ? 'Szukam pozycji…' : '📍 Moja lokalizacja'}
        </button>
      </div>
      {error && <p className="font-body text-body-sm text-on-surface-variant/70 mb-3">{error}</p>}
      {pick && list.length > 0 && !near.length && (
        <p className="font-body text-body-sm text-on-surface-variant mb-3">Brak imprez w promieniu {NEAR_KM} km. Najbliższe w innych miastach:</p>
      )}
      <ul className="space-y-4">
        {list.map(e => (
          <li key={e.id}>
            <Link href="/imprezy" className="group block no-underline">
              <div className="font-body text-body-md text-on-surface leading-snug group-hover:text-primary-container transition-colors">{e.event_name}</div>
              <div className="font-body text-body-sm text-on-surface-variant">
                {[fmtDay(e.event_date), e.start_time ? e.start_time.slice(0, 5) : null, e.venue?.name || e.location_name, e._city].filter(Boolean).join(' · ')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/imprezy" className={railLink}>Wszystkie imprezy →</Link>
    </section>
  )
}

/* ── Czat: ilu różnych autorów pisało w ostatnich 30 min; 0 → moduł ukryty ── */
function ChatModule({ count }) {
  if (!count) return null
  return (
    <section>
      <h3 className={railLabel}>Czat</h3>
      <Link href="/czat" className="font-body text-body-md text-on-surface no-underline hover:text-primary-container transition-colors">
        {count} {count === 1 ? 'osoba pisała' : 'osób pisało'} w ostatnich 30 minutach
      </Link>
      <Link href="/czat" className={railLink}>Wejdź na czat →</Link>
    </section>
  )
}

/* ── Najczęściej oglądane kluby (z logów page_views, bez ruchu z banera) ── */
const TOP_CLUBS = [364, 5, 415]
const slugify = (s) => String(s).toLowerCase()
  .replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function TopClubsModule() {
  const [clubs, setClubs] = useState([])
  useEffect(() => {
    apiFetchShared('/api/places')
      .then(data => setClubs(TOP_CLUBS.map(id => (data || []).find(v => v.id === id)).filter(Boolean)))
      .catch(() => setClubs([]))
  }, [])
  if (!clubs.length) return null
  return (
    <section>
      <h3 className={railLabel}>Najczęściej oglądane kluby</h3>
      <ul className="space-y-4">
        {clubs.map(v => (
          <li key={v.id}>
            <Link href={`/miejsca/${v.id}-${slugify(`${v.name} ${v.city}`)}`} className="group flex items-center gap-3 no-underline">
              <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-surface-container">
                {v.cover_image && <img src={v.cover_image} alt={v.name} loading="lazy" className="w-full h-full object-contain" />}
              </div>
              <div className="min-w-0">
                <div className="font-body text-body-md text-on-surface truncate group-hover:text-primary-container transition-colors">{v.name}</div>
                <div className="font-body text-body-sm text-on-surface-variant">{v.city}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/miejsca" className={railLink}>Wszystkie miejsca →</Link>
    </section>
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
  const [rail, setRail] = useState(null)
  useEffect(() => {
    if (!isDesktop) return
    apiFetchShared('/api/rail').then(setRail).catch(() => setRail(null))
    apiFetchShared('/api/articles')
      .then(data => setArticles((data || []).filter(a => a.slug && a.title)))
      .catch(() => setArticles([]))
  }, [isDesktop])

  const pool = exclude ? articles.filter(a => a.slug !== exclude) : articles
  // Ranking z page_views bez banera (/api/rail); fallback na articles.views gdy brak danych.
  const railPopular = (rail?.popular || []).filter(a => a.slug !== exclude).map(toRow)
  const popular = railPopular.length ? railPopular : [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(toRow)
  const newest = [...pool]
    .sort((a, b) => new Date(b.publish_date || b.created_at || 0) - new Date(a.publish_date || a.created_at || 0))
    .slice(0, 5).map(toRow)

  if (!isDesktop) return null

  return (
    <div className="space-y-10">
      <AdsModule ads={rail?.ads} />
      <NearbyEventsModule />
      <ChatModule count={rail?.chatActive} />
      <QuizModule onStartQuiz={onStartQuiz} quizDone={quizDone} />
      <ArticleModule title="Powiązane" items={related.map(toRow)} />
      <ArticleModule title="Najczęściej czytane" items={popular} />
      <ArticleModule title="Najnowsze" items={newest} />
      <TopClubsModule />
      <LastThemeModule />
      <WordModule />
    </div>
  )
}
