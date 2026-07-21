import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { Hero } from '../components/nocturne'

const DAY_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
const MONTH_PL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_PL[d.getDay()]}, ${d.getDate()} ${MONTH_PL[d.getMonth()]}`
}

function groupByDate(events) {
  const groups = {}
  for (const e of events) {
    (groups[e.event_date] ||= []).push(e)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function EventCard({ event }) {
  const venue = event.venue
  return (
    <div className="flex gap-4 py-5 border-b border-outline-variant/15">
      <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-surface-container flex items-center justify-center">
        {venue?.logo_url
          ? <img src={venue.logo_url} alt="" className="w-full h-full object-contain" />
          : <span className="text-xl">{event.is_external ? '🏨' : '🏠'}</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <div className="font-display italic font-medium text-body-lg text-on-surface leading-tight">{event.event_name}</div>
          {event.is_external && (
            <span className="font-body text-label-caps uppercase text-primary-container whitespace-nowrap">Zewnętrzna</span>
          )}
        </div>

        <div className="font-body text-body-md text-on-surface-variant mt-1">
          {venue ? `${venue.name} · ${venue.city}` : (event.location_name || event.organizer || '')}
          {event.location_address && !venue && <span className="text-on-surface-variant/70"> · {event.location_address}</span>}
        </div>

        {(event.start_time || event.end_time) && (
          <div className="font-body text-body-md text-on-surface-variant mt-1">
            {event.start_time?.slice(0, 5)}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}
          </div>
        )}

        {event.price && (
          <div className="font-body text-body-md text-primary-container font-semibold mt-1.5">{event.price}</div>
        )}

        {event.description && (
          <div className="font-body text-body-md text-on-surface-variant mt-1.5 leading-relaxed">{event.description}</div>
        )}

        {event.event_url && (
          <a href={event.event_url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-2 font-body text-label-caps uppercase text-primary-container hover:opacity-80">
            Więcej info →
          </a>
        )}
      </div>
    </div>
  )
}

export function Imprezy() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | club | external

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const from = new Date().toISOString().slice(0, 10)
        const to = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
        const data = await apiFetch(`/api/events?from=${from}&to=${to}`)
        setEvents(data || [])
      } catch { setEvents([]) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'club' ? events.filter(e => !e.is_external)
    : filter === 'external' ? events.filter(e => e.is_external)
    : events

  const grouped = groupByDate(filtered)

  const chip = (active) =>
    `font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
      active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
    }`

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Imprezy lifestyle – kluby i eventy | ExtraFun</title>
        <meta name="description" content="Nadchodzące imprezy w klubach lifestyle, swing i BDSM w Polsce. Sprawdź daty, miejsca i szczegóły eventów." />
        <link rel="canonical" href="https://extrafun.pl/imprezy" />
      </Helmet>

      <Hero
        image="/editorial/hero-imprezy.jpg"
        label="IMPREZY"
        title="Noc ma swój kalendarz"
        lead="Nadchodzące eventy — kluby lifestyle i imprezy prywatne w całej Polsce."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        <div className="flex gap-3 mb-10">
          {[
            { id: 'all', label: 'Wszystkie' },
            { id: 'club', label: 'Kluby' },
            { id: 'external', label: 'Prywatne / Hotel' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={chip(filter === f.id)}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : grouped.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display italic text-headline-sm text-on-surface mb-2">Brak nadchodzących imprez</div>
            <div className="font-body text-body-md text-on-surface-variant">Sprawdź ponownie wkrótce.</div>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([date, evs]) => (
              <div key={date}>
                <h2 className="font-body text-label-caps uppercase text-primary-container border-b border-outline-variant/20 pb-3 mb-2">{formatDate(date)}</h2>
                <div>{evs.map(e => <EventCard key={e.id} event={e} />)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
