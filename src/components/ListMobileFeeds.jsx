import { useLocation, Link } from 'wouter'
import { TILE_H, Cover, TileHero, useHtmlSnap } from './MagazynMobileFeed'
import { venueSlug } from '../lib/venueSlug'
import { formatDistance } from '../lib/geo'

// Mobile tile feeds for the three list pages (Imprezy, Plaże, Słownik).
// Same rules as the magazine feed: tile 1 = hero + controls, then one tile per
// item, tap = open. No placeholders: a tile only shows fields the item has.

const chip = (active) =>
  `font-body text-label-caps uppercase whitespace-nowrap pb-1 border-b-2 ${active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant'}`

const countLine = (loading, n, one, few, many) =>
  loading ? 'Ładowanie…' : n === 0 ? null : `${n} ${n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many} · przesuń w dół ↓`

/* ═══════════════ IMPREZY ═══════════════ */
const DAY_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
const MONTH_PL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
function fmtDate(dateStr) {
  const d = new Date(String(dateStr).slice(0, 10) + 'T12:00:00')
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  const base = `${DAY_PL[d.getDay()]}, ${d.getDate()} ${MONTH_PL[d.getMonth()]}`
  return diff === 0 ? `Dziś · ${base}` : diff === 1 ? `Jutro · ${base}` : base
}

function LogoPanel({ image, fallback }) {
  return (
    <div className="absolute inset-0 bg-surface-container-low flex items-start justify-center pt-20">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.10), transparent 70%)' }} />
      {image
        ? <img src={image} alt="" loading="lazy" className="relative max-w-[55%] max-h-[30%] object-contain" />
        : <span className="relative text-7xl opacity-30">{fallback}</span>}
    </div>
  )
}

function EventTile({ event }) {
  const [, navigate] = useLocation()
  const venue = event.venue
  const open = () => { if (venue) navigate('/miejsca/' + venueSlug(venue)) }
  const Wrapper = venue ? 'button' : 'div'
  return (
    <Wrapper onClick={venue ? open : undefined} className={`relative block w-full ${TILE_H} snap-start overflow-hidden text-left`}>
      {event.cover_image
        ? <Cover image={event.cover_image} position="center 30%" />
        : <LogoPanel image={venue?.logo_url} fallback={event.is_external ? '🏨' : '🎉'} />}
      <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6" style={event.cover_image ? undefined : { background: 'linear-gradient(0deg, rgba(18,20,20,.98) 0%, rgba(18,20,20,.9) 70%, rgba(18,20,20,0) 100%)' }}>
        <span className="font-body text-label-caps uppercase text-primary-container block mb-2">
          {fmtDate(event.event_date)}{event.is_external ? ' · Zewnętrzna' : ''}
        </span>
        <h2 className="font-display italic font-semibold text-headline-md text-on-surface leading-tight mb-3 line-clamp-3">{event.event_name}</h2>
        <div className="font-body text-body-md text-on-surface mb-1">
          {venue ? `${venue.name} · ${venue.city}` : (event.location_name || event.organizer || '')}
          {event.location_address && !venue && <span className="text-on-surface-variant"> · {event.location_address}</span>}
        </div>
        {(event.start_time || event.end_time) && (
          <div className="font-body text-body-md text-on-surface-variant">{event.start_time?.slice(0, 5)}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}</div>
        )}
        {event.price && <div className="font-body text-body-md text-primary-container font-semibold mt-1">{event.price}</div>}
        {event.description && <p className="font-body text-body-md text-on-surface-variant leading-relaxed line-clamp-4 mt-3">{event.description}</p>}
        <div className="flex gap-6 mt-4 font-body text-label-caps uppercase text-primary-container">
          {venue && <span>Lokal →</span>}
          {event.event_url && (
            <a href={event.event_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="no-underline text-primary-container">Więcej info ↗</a>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

export function ImprezyMobileFeed({ events, loading, filter, setFilter }) {
  useHtmlSnap(true)
  return (
    <div className="lg:hidden">
      <TileHero image="/editorial/hero-imprezy.jpg" label="Imprezy" title="Noc ma swój kalendarz">
        <div className="flex gap-5 mb-4">
          {[['all', 'Wszystkie'], ['club', 'Kluby'], ['external', 'Prywatne / Hotel']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={chip(filter === id)}>{label}</button>
          ))}
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container block">
          {countLine(loading, events.length, 'impreza', 'imprezy', 'imprez') || 'Brak nadchodzących imprez'}
        </span>
      </TileHero>
      {events.map(e => <EventTile key={e.id} event={e} />)}
    </div>
  )
}

/* ═══════════════ PLAŻE ═══════════════ */
function BeachTile({ beach, country }) {
  const gpsUrl = beach.lat && beach.lng ? `https://www.google.com/maps/search/?api=1&query=${beach.lat},${beach.lng}` : null
  return (
    <div className={`relative block w-full ${TILE_H} snap-start overflow-hidden`}>
      {beach.cover_image ? <Cover image={beach.cover_image} position="center" /> : <LogoPanel fallback="🏖️" />}
      <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6" style={beach.cover_image ? undefined : { background: 'linear-gradient(0deg, rgba(18,20,20,.98) 0%, rgba(18,20,20,.9) 70%, rgba(18,20,20,0) 100%)' }}>
        <span className="font-body text-label-caps uppercase text-primary-container block mb-2">
          {[country, beach.city].filter(Boolean).join(' · ')}{beach.distance != null ? ` · ${formatDistance(beach.distance)} od Ciebie` : ''}
        </span>
        <h2 className="font-display italic font-semibold text-headline-md text-on-surface leading-tight mb-3 line-clamp-2">{beach.name}</h2>
        {beach.description && <p className="font-body text-body-md text-on-surface-variant leading-relaxed line-clamp-5 mb-2">{beach.description}</p>}
        {beach.open_info && <div className="font-body text-body-md text-on-surface-variant mb-2">{beach.open_info}</div>}
        {gpsUrl && (
          <a href={gpsUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 font-body text-label-caps uppercase text-primary-container no-underline">📍 Nawiguj (GPS) ↗</a>
        )}
      </div>
    </div>
  )
}

export function PlazeMobileFeed({ beaches, countryOf, loading, countries, activeCountry, setActiveCountry, nearMe, onNearMe, hasLocation, geoLoading, geoError }) {
  useHtmlSnap(true)
  return (
    <div className="lg:hidden">
      <TileHero image="/editorial/hero-plaze.jpg" label="Plaże" title="Słońce, woda, wolność">
        <div className="flex flex-nowrap gap-x-5 overflow-x-auto scrollbar-none pb-1 mb-4">
          <button onClick={() => { setActiveCountry('all') }} className={chip(!nearMe && activeCountry === 'all')}>Wszystkie</button>
          {countries.map(c => <button key={c} onClick={() => setActiveCountry(c)} className={chip(!nearMe && activeCountry === c)}>{c}</button>)}
          <button onClick={onNearMe} className={chip(nearMe)}>📍 Blisko mnie</button>
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container block">
          {nearMe && !hasLocation
            ? (geoLoading ? 'Szukam lokalizacji…' : geoError || 'Włącz lokalizację, żeby zobaczyć najbliższe plaże')
            : (countLine(loading, beaches.length, 'plaża', 'plaże', 'plaż') || 'Brak plaż dla tego wyboru')}
        </span>
      </TileHero>
      {beaches.map(b => <BeachTile key={b.id} beach={b} country={countryOf(b)} />)}
    </div>
  )
}

/* ═══════════════ SŁOWNIK ═══════════════ */
function TermTile({ term }) {
  return (
    <Link href={`/slownik/${term.slug}`} className={`relative block w-full ${TILE_H} snap-start overflow-hidden no-underline px-margin-mobile flex flex-col justify-center bg-surface-container-low`}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.08), transparent 70%)' }} />
      <span className="relative font-body text-label-caps uppercase text-primary-container block mb-4">{term.category}</span>
      <h2 className="relative font-display italic font-semibold text-display-lg-mobile text-on-surface leading-none mb-5">{term.term}</h2>
      <p className="relative font-body text-body-lg text-on-surface-variant leading-snug line-clamp-[9]">{term.definition}</p>
      <span className="relative font-body text-label-caps uppercase text-primary-container block mt-6">Całe hasło →</span>
    </Link>
  )
}

export function SlownikMobileFeed({ terms, total, q, setQ, categories, activeCategory, setActiveCategory }) {
  useHtmlSnap(true)
  return (
    <div className="lg:hidden">
      <TileHero image="/editorial/hero-slownik.jpg" label="Leksykon współczesnej intymności" title="Słownik Pojęć">
        <div className="relative mb-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj terminu…"
            className="w-full box-border bg-surface-container/80 border border-outline-variant/30 px-3 py-2.5 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50" />
          {q && <button onClick={() => setQ('')} aria-label="Wyczyść" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">✕</button>}
        </div>
        <div className="flex flex-nowrap gap-x-5 overflow-x-auto scrollbar-none pb-1 mb-3">
          <button onClick={() => setActiveCategory('all')} className={chip(activeCategory === 'all')}>Wszystkie</button>
          {categories.map(c => <button key={c} onClick={() => setActiveCategory(c)} className={chip(activeCategory === c)}>{c}</button>)}
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container block">
          {terms.length === 0 ? 'Brak haseł dla tego wyboru' : `${terms.length} z ${total} haseł · przesuń w dół ↓`}
        </span>
      </TileHero>
      {terms.map(t => <TermTile key={t.slug} term={t} />)}
    </div>
  )
}
