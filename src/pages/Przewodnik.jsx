import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'

const DEMO_VENUES = [
  {
    id: '1', name: 'Club Enigma', type: 'klub',
    description: 'Elegancki klub lifestylowy dla par i singli. Dyskretna atmosfera, profesjonalna obsługa.',
    city: 'Warszawa', address: 'ul. Narbutta 27, Warszawa',
    lat: 52.2297, lng: 21.0122,
  },
  {
    id: '2', name: 'Sauna Mystique', type: 'sauna',
    description: 'Relaksująca sauna z pełnym wyposażeniem. Bezpieczne, dyskretne środowisko.',
    city: 'Kraków', address: 'ul. Kazimierza 15, Kraków',
    lat: 50.0647, lng: 19.9450,
  },
  {
    id: '3', name: 'Libertine Lounge', type: 'bar',
    description: 'Mieszana przestrzeń lifestylowa – od soft play po pełne imprezy.',
    city: 'Wrocław', address: 'ul. Świdnicka 45, Wrocław',
    lat: 51.1079, lng: 17.0385,
  },
]

const TYPE_CONFIG = {
  klub:        { label: 'Klub',        color: '#00E5FF', bg: 'rgba(0,229,255,0.12)',   icon: '🎭' },
  bar:         { label: 'Bar',         color: '#FF0080', bg: 'rgba(255,0,128,0.12)',   icon: '🍸' },
  sauna:       { label: 'Sauna',       color: '#9D4EDD', bg: 'rgba(157,78,221,0.12)', icon: '♨️' },
  kawiarnia:   { label: 'Kawiarnia',   color: '#FFA500', bg: 'rgba(255,165,0,0.12)',  icon: '☕' },
  restauracja: { label: 'Restauracja', color: '#00FF96', bg: 'rgba(0,255,150,0.12)',  icon: '🍴' },
  inne:        { label: 'Inne',        color: '#888',    bg: 'rgba(136,136,136,0.12)',icon: '📍' },
}

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.inne
}

function VenueDetail({ venue, onBack }) {
  const t = getTypeConfig(venue.type)
  const [recurringEvents, setRecurringEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase
        .from('recurring_events')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('one_time_events')
        .select('*')
        .eq('venue_id', venue.id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(10),
    ]).then(([rec, one]) => {
      setRecurringEvents(rec.data || [])
      setUpcomingEvents(one.data || [])
    })
  }, [venue.id])

  const DAY_NAMES = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 16 }}>Szczegóły miejsca</h1>
      </div>
      <div style={{ padding: '0 0 80px' }}>
        <div className="venue-card-img" style={{ fontSize: 72, height: 180, background: `linear-gradient(135deg, ${t.bg.replace('0.12', '0.4')}, rgba(10,10,30,0.8))` }}>
          {t.icon}
        </div>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, flex: 1 }}>{venue.name}</h2>
            {venue.distance != null && (
              <span className="venue-card-distance">{formatDistance(venue.distance)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="venue-type-badge" style={{ background: t.bg, color: t.color }}>
              {t.label}
            </span>
            {venue.district && (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{venue.district}</span>
            )}
          </div>
          {venue.description && (
            <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
              {venue.description}
            </p>
          )}
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: venue.website || venue.phone ? 10 : 0 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{venue.address}, {venue.city}</span>
            </div>
            {venue.phone && (
              <div style={{ display: 'flex', gap: 10, marginBottom: venue.website ? 10 : 0 }}>
                <span style={{ fontSize: 16 }}>📞</span>
                <a href={`tel:${venue.phone}`} style={{ fontSize: 14, color: '#00E5FF' }}>{venue.phone}</a>
              </div>
            )}
            {venue.website && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🌐</span>
                <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#00E5FF', wordBreak: 'break-all' }}>{venue.website}</a>
              </div>
            )}
          </div>

          {recurringEvents.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>🔁 Stały program</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recurringEvents.map(ev => (
                  <div key={ev.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.event_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {DAY_NAMES[ev.day_of_week]} · {ev.start_time}{ev.end_time && `–${ev.end_time}`}
                      </div>
                    </div>
                    {ev.price && <span style={{ fontSize: 12, fontWeight: 700, color: '#00E5FF', whiteSpace: 'nowrap' }}>{ev.price}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>📅 Nadchodzące imprezy</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.event_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {new Date(ev.event_date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {ev.start_time && ` · ${ev.start_time}`}{ev.end_time && `–${ev.end_time}`}
                      </div>
                    </div>
                    {ev.price && <span style={{ fontSize: 12, fontWeight: 700, color: '#00E5FF', whiteSpace: 'nowrap' }}>{ev.price}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginTop: 16, display: 'block' }}>
              <button className="btn-primary" style={{ width: '100%' }}>🌐 Przejdź do strony</button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function Przewodnik() {
  const [view, setView] = useState('venues')
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [selected, setSelected] = useState(null)
  const [allEvents, setAllEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => {
    loadVenues()
    requestLocation()
  }, [])

  useEffect(() => {
    if (view === 'events' && allEvents.length === 0) loadEvents()
  }, [view])

  async function loadVenues() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, type, address, city, district, lat, lng, website, phone, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (error || !data || data.length === 0) setVenues(DEMO_VENUES)
      else setVenues(data)
    } catch {
      setVenues(DEMO_VENUES)
    } finally {
      setLoading(false)
    }
  }

  async function loadEvents() {
    setEventsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('one_time_events')
        .select('*, venues(name, city, type)')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(60)
      setAllEvents(data || [])
    } finally {
      setEventsLoading(false)
    }
  }

  const displayVenues = location ? sortByDistance(venues, location.lat, location.lng) : venues
  const filtered = activeType === 'all' ? displayVenues : displayVenues.filter(v => v.type === activeType)
  const types = [
    { id: 'all', label: 'Wszystkie' },
    ...Object.entries(TYPE_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label }))
  ]

  const eventsByDate = allEvents.reduce((acc, ev) => {
    const key = ev.event_date
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  if (selected) {
    const v = displayVenues.find(v => v.id === selected)
    if (v) return <VenueDetail venue={v} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      <div className="page-header">
        <h1>📍 Miejsca</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`category-chip ${view === 'venues' ? 'active' : ''}`}
          onClick={() => setView('venues')}
        >🏠 Lokale</button>
        <button
          className={`category-chip ${view === 'events' ? 'active' : ''}`}
          onClick={() => setView('events')}
        >📅 Imprezy</button>
      </div>

      {view === 'events' ? (
        eventsLoading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : Object.keys(eventsByDate).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">Brak nadchodzących imprez</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80 }}>
            {Object.entries(eventsByDate).map(([date, evs]) => (
              <div key={date}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {evs.map(ev => (
                    <div
                      key={ev.id}
                      className="glass-card"
                      style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, cursor: ev.venues ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (ev.venues) {
                          const v = venues.find(v => v.name === ev.venues.name)
                          if (v) setSelected(v.id)
                        }
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.event_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>
                          {ev.venues?.name} · {ev.start_time}{ev.end_time && `–${ev.end_time}`}
                        </div>
                        {ev.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{ev.description}</div>
                        )}
                      </div>
                      {ev.price && <span style={{ fontSize: 13, fontWeight: 700, color: '#00E5FF', whiteSpace: 'nowrap' }}>{ev.price}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="location-bar">
            <span className="location-bar-icon">📡</span>
            <span className="location-bar-text">
              {geoLoading ? 'Szukam lokalizacji...' :
               location ? <><strong>Lokalizacja aktywna</strong> – odległości od Ciebie</> :
               geoError ? 'Lokalizacja niedostępna' : 'Włącz lokalizację'}
            </span>
            {!location && !geoLoading && (
              <button className="location-bar-btn" onClick={requestLocation}>Włącz GPS</button>
            )}
          </div>

          <div className="category-filter">
            {types.map(({ id, label }) => (
              <button
                key={id}
                className={`category-chip ${activeType === id ? 'active' : ''}`}
                onClick={() => setActiveType(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏙️</div>
              <div className="empty-title">Brak miejsc</div>
              <div className="empty-desc">Nie znaleziono miejsc tego typu.</div>
            </div>
          ) : (
            <div className="venue-list">
              {filtered.map(venue => {
                const t = getTypeConfig(venue.type)
                return (
                  <div key={venue.id} className="venue-card" onClick={() => setSelected(venue.id)}>
                    <div className="venue-card-img" style={{ fontSize: 32 }}>
                      {t.icon}
                    </div>
                    <div className="venue-card-body">
                      <div className="venue-card-top">
                        <div className="venue-card-name">{venue.name}</div>
                        {venue.distance != null && (
                          <span className="venue-card-distance">{formatDistance(venue.distance)}</span>
                        )}
                      </div>
                      <div className="venue-card-meta">
                        <span className="venue-type-badge" style={{ background: t.bg, color: t.color }}>
                          {t.label}
                        </span>
                        <span>📍 {venue.city}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
