import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'

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
  const venue = event.swingers_venues
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      {/* Logo / ikona */}
      <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {venue?.logo_url
          ? <img src={venue.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: 22 }}>{event.is_external ? '🏨' : '🏠'}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.3 }}>{event.event_name}</div>
          {event.is_external && (
            <span style={{ fontSize: 11, background: 'rgba(157,78,221,0.2)', color: '#9D4EDD', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>Impreza zewnętrzna</span>
          )}
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          {venue ? `${venue.name} · ${venue.city}` : (event.location_name || event.organizer || '')}
          {event.location_address && !venue && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {event.location_address}</span>}
        </div>

        {(event.start_time || event.end_time) && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
            🕐 {event.start_time?.slice(0, 5)}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}
          </div>
        )}

        {event.price && (
          <div style={{ marginTop: 6, fontSize: 13, color: '#00E5FF', fontWeight: 600 }}>
            {event.price}
          </div>
        )}

        {event.description && (
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            {event.description}
          </div>
        )}

        {event.event_url && (
          <a href={event.event_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#9D4EDD', textDecoration: 'none' }}>
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
        // Następne 60 dni
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

  return (
    <div className="page-inner">
      <Helmet>
        <title>Imprezy lifestyle – kluby i eventy | ExtraFun</title>
        <meta name="description" content="Nadchodzące imprezy w klubach lifestyle, swing i BDSM w Polsce. Sprawdź daty, miejsca i szczegóły eventów." />
        <link rel="canonical" href="https://extrafun.pl/imprezy" />
      </Helmet>
      <div className="page-header">
        <h1>Imprezy</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Nadchodzące eventi — kluby i imprezy prywatne</p>
      </div>

      {/* Filtry */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        {[
          { id: 'all', label: 'Wszystkie' },
          { id: 'club', label: 'Kluby' },
          { id: 'external', label: 'Prywatne / Hotel' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              fontSize: 13, padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: filter === f.id ? 'linear-gradient(135deg,#00E5FF,#9D4EDD)' : 'rgba(255,255,255,0.08)',
              color: filter === f.id ? '#fff' : 'rgba(255,255,255,0.6)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>Ładowanie...</div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 15 }}>Brak nadchodzących imprez</div>
            <div style={{ fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,0.25)' }}>Sprawdź ponownie wkrótce</div>
          </div>
        ) : grouped.map(([date, evs]) => (
          <div key={date}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              {formatDate(date)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {evs.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
