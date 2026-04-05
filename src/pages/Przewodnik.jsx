import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'
import { PageTitle } from '../components/PageTitle'

// Fallback demo venues if Supabase table is empty
const DEMO_VENUES = [
  {
    id: '1', name: 'Club Enigma', type: 'club',
    description: 'Elegancki klub lifestylowy dla par i singli. Dyskretna atmosfera, profesjonalna obsługa.',
    city: 'Warszawa', address: 'ul. Narbutta 27, Warszawa',
    latitude: 52.2297, longitude: 21.0122,
    rating: 4.8, price_range: '$$', verified: true,
    opening_hours: { open: '21:00', close: '04:00', days: 'Pt-Nd' },
    emoji: '🔮'
  },
  {
    id: '2', name: 'Dungeon Mystique', type: 'bdsm',
    description: 'Profesjonalne studio BDSM z pełnym wyposażeniem. Bezpieczne, dyskretne środowisko.',
    city: 'Kraków', address: 'ul. Kazimierza 15, Kraków',
    latitude: 50.0647, longitude: 19.9450,
    rating: 4.6, price_range: '$$$', verified: true,
    opening_hours: { open: '20:00', close: '03:00', days: 'Cz-Nd' },
    emoji: '⛓️'
  },
  {
    id: '3', name: 'Libertine Lounge', type: 'club',
    description: 'Mieszana przestrzeń lifestylowa – od soft play po pełne imprezy swingerskie.',
    city: 'Wrocław', address: 'ul. Świdnicka 45, Wrocław',
    latitude: 51.1079, longitude: 17.0385,
    rating: 4.5, price_range: '$$', verified: true,
    opening_hours: { open: '22:00', close: '05:00', days: 'Sb-Nd' },
    emoji: '🥂'
  },
  {
    id: '4', name: 'Paradise Events', type: 'party',
    description: 'Organizacja prywatnych imprez lifestylowych w ekskluzywnych lokalach.',
    city: 'Gdańsk', address: 'Długi Targ 20, Gdańsk',
    latitude: 54.3520, longitude: 18.6466,
    rating: 4.7, price_range: '$$$', verified: false,
    opening_hours: { open: '22:00', close: '06:00', days: 'Sb' },
    emoji: '🎉'
  },
  {
    id: '5', name: 'Fetish Club Noir', type: 'fetish',
    description: 'Klub fetyszowy z tematycznymi imprezami i specjalnymi strefami.',
    city: 'Poznań', address: 'ul. Półwiejska 12, Poznań',
    latitude: 52.4082, longitude: 16.9335,
    rating: 4.4, price_range: '$$', verified: true,
    opening_hours: { open: '21:00', close: '04:00', days: 'Pt-Sb' },
    emoji: '🖤'
  },
  {
    id: '6', name: 'Poly Café', type: 'meetup',
    description: 'Cykliczne spotkania społeczności CNM i poliamporycznej. Zero presji, czysto towarzysko.',
    city: 'Warszawa', address: 'ul. Marszałkowska 84, Warszawa',
    latitude: 52.2318, longitude: 21.0127,
    rating: 4.9, price_range: '$', verified: true,
    opening_hours: { open: '18:00', close: '22:00', days: 'Co środa' },
    emoji: '☕'
  },
]

const TYPE_CONFIG = {
  club: { label: 'Klub', color: '#00E5FF', bg: 'rgba(0,229,255,0.12)' },
  sauna: { label: 'Sauna', color: '#FF0080', bg: 'rgba(255,0,128,0.12)' },
  resort: { label: 'Resort / Hotel', color: '#9D4EDD', bg: 'rgba(157,78,221,0.12)' },
  bar: { label: 'Bar', color: '#FFA500', bg: 'rgba(255,165,0,0.12)' },
}

function VenueDetail({ venue, onBack }) {
  const t = TYPE_CONFIG[venue.type] || TYPE_CONFIG.club
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
        <div className="venue-card-img" style={{ fontSize: 72, height: 180, background: `linear-gradient(135deg, ${t.bg.replace('0.12','0.4')}, rgba(10,10,30,0.8))` }}>
          {venue.emoji || '📍'}
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
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
            {venue.description}
          </p>
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{venue.address}, {venue.city}</span>
            </div>
            {venue.website && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🌐</span>
                <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#00E5FF', wordBreak: 'break-all' }}>{venue.website}</a>
              </div>
            )}
          </div>
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%' }}>🌐 Przejdź do strony</button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function Przewodnik() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [selected, setSelected] = useState(null)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => {
    loadVenues()
    requestLocation()
  }, [])

  async function loadVenues() {
    try {
      const { data, error } = await supabase.from('swingers_venues').select('*').order('name', { ascending: true })
      if (error || !data || data.length === 0) {
        setVenues(DEMO_VENUES)
      } else {
        setVenues(data)
      }
    } catch {
      setVenues(DEMO_VENUES)
    } finally {
      setLoading(false)
    }
  }

  const displayVenues = location
    ? sortByDistance(venues, location.lat, location.lng)
    : venues

  const filtered = activeType === 'all'
    ? displayVenues
    : displayVenues.filter(v => v.type === activeType)

  const types = [
    { id: 'all', label: 'Wszystkie' },
    ...Object.entries(TYPE_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label }))
  ]

  if (selected) {
    const v = displayVenues.find(v => v.id === selected)
    if (v) return <VenueDetail venue={v} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      <div className="page-header">
        <PageTitle section="Miejsca" />
      </div>

      {/* Location bar */}
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

      {/* Type filter */}
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
            const t = TYPE_CONFIG[venue.type] || TYPE_CONFIG.club
            return (
              <div key={venue.id} className="venue-card" onClick={() => setSelected(venue.id)}>
                <div className="venue-card-img">
                  {venue.emoji || '📍'}
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
    </div>
  )
}
