import { useRef, useState } from 'react'
import { TILE_H, Cover, Dots, useHtmlSnap } from './MagazynMobileFeed'
import { formatDistance } from '../lib/geo'
import { useImpression, trackClick } from '../lib/cardStats'
import { CardStatBadge } from './CardStatBadge'

// Mobile /miejsca = full-screen tiles (same logic as the magazine feed):
// tile 1 = scope chooser (Blisko mnie / city) + day; then one tile per venue
// open on that day; swipe right on a venue = its week; tap = venue page.

const DNI = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
const DNI_FULL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']

/* ── Tile 1: hero with scope + day controls ── */
function HeroTile({ scope, cities, onScope, dayOffset, onDay, hasLocation, geoLoading, geoError, onRequestLocation, count }) {
  return (
    <div className={`relative w-full ${TILE_H} snap-start overflow-hidden`}>
      <Cover image="/editorial/hero-przewodnik.jpg" position="center" />
      <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6">
        <span className="font-body text-label-caps uppercase text-primary-container block mb-2">Przewodnik</span>
        <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-none mb-5">Scena lifestyle — blisko Ciebie</h1>

        <div className="flex items-center gap-3 mb-4">
          <span className="font-body text-label-caps uppercase text-on-surface-variant">Pokaż</span>
          <div className="relative">
            <select
              value={scope || ''}
              onChange={(e) => { const v = e.target.value; if (v === 'nearby' && !hasLocation) onRequestLocation(); onScope(v) }}
              style={{ colorScheme: 'dark' }}
              className="appearance-none bg-transparent border-b border-primary-container/40 focus:border-primary-container outline-none font-display italic text-headline-sm text-on-surface pr-8 py-1"
            >
              <option value="nearby">Blisko mnie</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-primary-container">▾</span>
          </div>
        </div>

        <div className="flex gap-5 mb-5">
          {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
            <button key={off} onClick={() => onDay(off)}
              className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${dayOffset === off ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant'}`}>
              {label}
            </button>
          ))}
        </div>

        {scope === 'nearby' && !hasLocation ? (
          <span className="font-body text-body-md text-on-surface-variant block">
            {geoLoading ? 'Szukam lokalizacji…' : geoError || 'Pozwól na lokalizację albo wybierz miasto.'}
          </span>
        ) : (
          <span className="font-body text-label-caps uppercase text-primary-container block">
            {count === 0 ? 'Nic otwartego — zmień dzień lub miasto' : `${count} ${count === 1 ? 'lokal otwarty' : count < 5 ? 'lokale otwarte' : 'lokali otwartych'} · przesuń w dół ↓`}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Logo panel (venues have a wordmark, not a photo) ── */
function LogoPanel({ venue, typeCfg }) {
  return (
    <div className="absolute inset-0 bg-surface-container-low flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.10), transparent 70%)' }} />
      {venue.logo_url
        ? <img src={venue.logo_url} alt={venue.name} loading="lazy" className="relative max-w-[60%] max-h-[38%] object-contain -translate-y-24" />
        : <span className="relative text-6xl opacity-25 -translate-y-24">{typeCfg.icon}</span>}
    </div>
  )
}

/* ── Venue tile: card slide + week slide (only when the venue has a schedule) ── */
function VenueTile({ venue, typeCfg, status, onOpen }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const hasWeek = (venue.events && venue.events.length > 0) || (venue.oneTime && venue.oneTime.length > 0)
  const onScroll = () => { const el = ref.current; if (el) setActive(Math.round(el.scrollLeft / el.clientWidth)) }
  const impRef = useImpression('venue', venue.id)
  const open = () => { trackClick('venue', venue.id); onOpen() }

  const today = new Date()
  const week = hasWeek ? [0, 1, 2, 3, 4, 5, 6].map(off => {
    const d = new Date(today); d.setDate(d.getDate() + off)
    const dow = d.getDay()
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const special = (venue.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === ymd)
    const evs = (venue.events || []).filter(e => e.day_of_week === dow)
    return { off, dow, date: d.getDate(), special, evs }
  }) : []

  return (
    <div ref={impRef} className={`relative w-full ${TILE_H} snap-start overflow-hidden`}>
      <Dots count={hasWeek ? 2 : 1} active={active} />
      <CardStatBadge kind="venue" id={venue.id} className="absolute top-4 left-margin-mobile z-10" />
      <div ref={ref} onScroll={onScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none">
        {/* Slide 1 — the card */}
        <button onClick={open} className="relative block shrink-0 w-full h-full snap-start text-left">
          <LogoPanel venue={venue} typeCfg={typeCfg} />
          <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6" style={{ background: 'linear-gradient(0deg, rgba(18,20,20,.98) 0%, rgba(18,20,20,.9) 70%, rgba(18,20,20,0) 100%)' }}>
            <span className="font-body text-label-caps uppercase text-primary-container block mb-2">
              {typeCfg.label} · {venue.city}{venue.distance != null ? ` · ${formatDistance(venue.distance)}` : ''}
            </span>
            <h2 className="font-display italic font-semibold text-headline-md text-on-surface leading-tight mb-3">{venue.name}</h2>
            <div className="mb-3">{status}</div>
            {venue.description && (
              <p className="font-body text-body-md text-on-surface-variant leading-relaxed line-clamp-3 mb-4">{venue.description}</p>
            )}
            <span className="font-body text-label-caps uppercase text-primary-container">
              Zobacz lokal →{hasWeek ? ' · tydzień: przesuń →' : ''}
            </span>
          </div>
        </button>

        {/* Slide 2 — the week (real schedule only) */}
        {hasWeek && (
          <div className="relative shrink-0 w-full h-full snap-start bg-surface-container-low px-margin-mobile pt-12 pb-6 overflow-y-auto">
            <span className="font-body text-label-caps uppercase text-primary-container block mb-1">{venue.name}</span>
            <h3 className="font-display italic font-medium text-headline-sm text-on-surface mb-5">Najbliższe 7 dni</h3>
            <div className="space-y-3">
              {week.map(({ off, dow, date, special, evs }) => (
                <div key={off} className={`pl-3 border-l-2 ${off === 0 ? 'border-primary-container' : 'border-outline-variant/30'}`}>
                  <div className={`font-body text-label-caps uppercase mb-1 ${off === 0 ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                    {off === 0 ? 'Dziś' : off === 1 ? 'Jutro' : DNI_FULL[dow]} · {DNI[dow]} {date}
                  </div>
                  {special ? (
                    <div className="font-body text-body-md text-on-surface">
                      <span className="text-primary-container font-semibold">★ {special.event_name}</span>
                      {(special.start_time || special.end_time) && <> · {special.start_time}{special.end_time ? `–${special.end_time}` : ''}</>}
                      {special.price && <> · {special.price}</>}
                    </div>
                  ) : evs.length === 0 ? (
                    <div className="font-body text-body-md text-on-surface-variant/60">Zamknięte</div>
                  ) : evs.map(e => (
                    <div key={e.id} className="font-body text-body-md text-on-surface">
                      <span className="font-semibold">{e.event_name}</span>
                      {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
                      {e.price && <> · {e.price}</>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={open} className="font-body text-label-caps uppercase text-primary-container mt-6">Zobacz lokal →</button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * @param venues   venues open on the chosen day, already scoped and sorted
 *                 (each with _special/_dayEvents/_eventClub attached)
 * @param renderStatus (venue) => node — the shared VenueStatus line
 * @param typeCfgOf    (type) => TYPE_CONFIG entry
 */
export function MiejscaMobileFeed({ venues, scope, cities, onScope, dayOffset, onDay, hasLocation, geoLoading, geoError, onRequestLocation, loading, renderStatus, typeCfgOf, onOpenVenue }) {
  useHtmlSnap(true)
  return (
    <div className="lg:hidden">
      <HeroTile
        scope={scope} cities={cities} onScope={onScope}
        dayOffset={dayOffset} onDay={onDay}
        hasLocation={hasLocation} geoLoading={geoLoading} geoError={geoError} onRequestLocation={onRequestLocation}
        count={loading ? 0 : venues.length}
      />
      {venues.map(v => (
        <VenueTile key={v.id} venue={v} typeCfg={typeCfgOf(v.type)} status={renderStatus(v)} onOpen={() => onOpenVenue(v)} />
      ))}
    </div>
  )
}
