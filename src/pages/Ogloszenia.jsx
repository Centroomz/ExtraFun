import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'

const TYPES = [
  { id: 'looking', label: 'Szukam', emoji: '🔍', color: '#00E5FF', bg: 'rgba(0,229,255,0.12)' },
  { id: 'event', label: 'Wydarzenie', emoji: '🎉', color: '#FF0080', bg: 'rgba(255,0,128,0.12)' },
  { id: 'sale', label: 'Sprzedaż', emoji: '🛍️', color: '#FFA500', bg: 'rgba(255,165,0,0.12)' },
]

const DEMO_ADS = [
  { id: '1', type: 'looking', title: 'Para bi poszukuje kobiety do tria', description: 'Jesteśmy otwartą parą (35/33) szukającą biseksualnej kobiety do spotkania. Cenimy komunikację i wzajemny szacunek.', city: 'Warszawa', latitude: 52.2297, longitude: 21.0122, created_at: new Date(Date.now() - 2*3600000).toISOString(), author_name: 'Para_WAW', author_emoji: '💑' },
  { id: '2', type: 'event', title: 'Prywatna impreza swingerska – sobota 22:00', description: 'Zapraszamy na dyskretną imprezę w prywatnym domu. Miejsce dla 10-15 par. Dress code: elegancki. Weryfikacja telefoniczna.', city: 'Kraków', latitude: 50.0647, longitude: 19.9450, created_at: new Date(Date.now() - 5*3600000).toISOString(), author_name: 'Host_Krakow', author_emoji: '🥂' },
  { id: '3', type: 'looking', title: 'Singl bi (28) szuka pary lub osoby do zabaw', description: 'Biseksualny mężczyzna, 28 lat, Wrocław. Szukam par lub singli do regularnych spotkań. Dyskretny, zadbany.', city: 'Wrocław', latitude: 51.1079, longitude: 17.0385, created_at: new Date(Date.now() - 8*3600000).toISOString(), author_name: 'Alex_WRO', author_emoji: '💫' },
  { id: '4', type: 'event', title: 'Meetup poliamoryczny – kawa i rozmowa', description: 'Cykliczne spotkanie osób zainteresowanych poliamorią i CNM. Kawiarnia w centrum, ciepła atmosfera, bez presji.', city: 'Warszawa', latitude: 52.2318, longitude: 21.0127, created_at: new Date(Date.now() - 1*3600000).toISOString(), author_name: 'Poly_WAW', author_emoji: '☕' },
  { id: '5', type: 'sale', title: 'Sprzedaję sprzęt BDSM – stan idealny', description: 'Zestaw: kajdanki ze stali, pejcz, kajdanki do łóżka, maska. Wszystko w bardzo dobrym stanie, używane rzadko. Odbiór Gdańsk lub wysyłka.', city: 'Gdańsk', latitude: 54.3520, longitude: 18.6466, created_at: new Date(Date.now() - 24*3600000).toISOString(), author_name: 'Seller_GD', author_emoji: '⚡' },
  { id: '6', type: 'looking', title: 'Kobieta 40+ poszukuje Pana do relacji D/s', description: 'Dojrzała, niezależna kobieta szuka dominującego mężczyzny do regularnej relacji D/s. Cenię szczerość i doświadczenie.', city: 'Poznań', latitude: 52.4082, longitude: 16.9335, created_at: new Date(Date.now() - 3*3600000).toISOString(), author_name: 'Lady_P', author_emoji: '🌹' },
]

const DISTANCE_FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: '5', label: 'Do 5 km' },
  { id: '25', label: 'Do 25 km' },
  { id: '100', label: 'Do 100 km' },
]

function AdDetail({ ad, onBack, user }) {
  const typeConfig = TYPES.find(t => t.id === ad.type) || TYPES[0]
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 16 }}>Ogłoszenie</h1>
      </div>
      <div style={{ padding: '16px 16px 80px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: typeConfig.bg, color: typeConfig.color }}>
            {typeConfig.emoji} {typeConfig.label}
          </span>
          {ad.distance != null && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>{formatDistance(ad.distance)}</span>
          )}
        </div>
        <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>{ad.title}</h2>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
          <span>{ad.author_emoji} {ad.author_name}</span>
          <span>📍 {ad.city}</span>
          <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>{ad.description}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {user ? (
            <button className="btn-primary" style={{ flex: 1 }}>💬 Napisz wiadomość</button>
          ) : (
            <button className="btn-ghost" style={{ flex: 1 }}>Zaloguj się, aby kontaktować</button>
          )}
          <button className="btn-ghost" style={{ padding: '12px 16px' }}>🚨</button>
        </div>
      </div>
    </div>
  )
}

export function Ogloszenia({ user }) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [distanceFilter, setDistanceFilter] = useState('all')
  const [selectedAd, setSelectedAd] = useState(null)
  const [showNewAd, setShowNewAd] = useState(false)
  const [newAd, setNewAd] = useState({ type: 'looking', title: '', description: '', city: '' })
  const [submitting, setSubmitting] = useState(false)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => {
    loadAds()
    requestLocation()
  }, [])

  async function loadAds() {
    try {
      const { data, error } = await supabase
        .from('classifieds')
        .select('*')
        .order('created_at', { ascending: false })
      if (error || !data || data.length === 0) {
        setAds(DEMO_ADS)
      } else {
        setAds(data)
      }
    } catch {
      setAds(DEMO_ADS)
    } finally {
      setLoading(false)
    }
  }

  async function submitAd() {
    if (!newAd.title.trim() || !user || submitting) return
    setSubmitting(true)
    try {
      await supabase.from('classifieds').insert({
        ...newAd,
        author_id: user.id,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        expires_at: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      })
      setNewAd({ type: 'looking', title: '', description: '', city: '' })
      setShowNewAd(false)
      loadAds()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  let displayAds = location ? sortByDistance(ads, location.lat, location.lng) : ads
  if (activeType !== 'all') displayAds = displayAds.filter(a => a.type === activeType)
  if (distanceFilter !== 'all' && location) {
    const maxKm = parseInt(distanceFilter)
    displayAds = displayAds.filter(a => a.distance == null || a.distance <= maxKm)
  }

  if (selectedAd) {
    const ad = displayAds.find(a => a.id === selectedAd) || ads.find(a => a.id === selectedAd)
    if (ad) return <AdDetail ad={ad} onBack={() => setSelectedAd(null)} user={user} />
  }

  return (
    <div>
      <div className="page-header">
        <h1>📢 Ogłoszenia</h1>
      </div>

      {/* Location bar */}
      <div className="location-bar">
        <span className="location-bar-icon">📡</span>
        <span className="location-bar-text">
          {geoLoading ? 'Szukam lokalizacji...' :
           location ? <><strong>Lokalizacja aktywna</strong> – sortuję po odległości</> :
           'Włącz lokalizację, aby zobaczyć odległości'}
        </span>
        {!location && !geoLoading && (
          <button className="location-bar-btn" onClick={requestLocation}>GPS</button>
        )}
      </div>

      {/* Type filter */}
      <div className="category-filter">
        <button
          className={`category-chip ${activeType === 'all' ? 'active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          Wszystkie
        </button>
        {TYPES.map(t => (
          <button
            key={t.id}
            className={`category-chip ${activeType === t.id ? 'active' : ''}`}
            onClick={() => setActiveType(t.id)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Distance filter */}
      {location && (
        <div className="category-filter" style={{ paddingTop: 0 }}>
          {DISTANCE_FILTERS.map(f => (
            <button
              key={f.id}
              className={`category-chip ${distanceFilter === f.id ? 'active' : ''}`}
              onClick={() => setDistanceFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : displayAds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Brak ogłoszeń</div>
          <div className="empty-desc">Nie znaleziono ogłoszeń spełniających kryteria.</div>
        </div>
      ) : (
        <div className="classified-list">
          {displayAds.map(ad => {
            const typeConfig = TYPES.find(t => t.id === ad.type) || TYPES[0]
            return (
              <div key={ad.id} className="classified-card" onClick={() => setSelectedAd(ad.id)}>
                <div className="classified-top">
                  <span className="classified-type" style={{ background: typeConfig.bg, color: typeConfig.color }}>
                    {typeConfig.emoji} {typeConfig.label}
                  </span>
                  {ad.distance != null && (
                    <span className="classified-distance">{formatDistance(ad.distance)}</span>
                  )}
                </div>
                <div className="classified-title">{ad.title}</div>
                <div className="classified-desc">{ad.description}</div>
                <div className="classified-meta">
                  <span>{ad.author_emoji || '👤'} {ad.author_name || 'Użytkownik'}</span>
                  <span>📍 {ad.city}</span>
                  <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {user && (
        <button className="fab" onClick={() => setShowNewAd(true)}>+</button>
      )}

      {/* New ad sheet */}
      {showNewAd && (
        <div className="form-sheet">
          <div className="form-sheet-bg" onClick={() => setShowNewAd(false)} />
          <div className="form-sheet-card">
            <div className="form-sheet-title">Dodaj ogłoszenie</div>
            <div className="form-group">
              <label className="form-label">Typ</label>
              <select
                className="form-input"
                value={newAd.type}
                onChange={e => setNewAd(prev => ({ ...prev, type: e.target.value }))}
              >
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input
                className="form-input"
                placeholder="Tytuł ogłoszenia..."
                value={newAd.title}
                onChange={e => setNewAd(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opis</label>
              <textarea
                className="form-input"
                placeholder="Szczegółowy opis..."
                value={newAd.description}
                onChange={e => setNewAd(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Miasto</label>
              <input
                className="form-input"
                placeholder="Np. Warszawa"
                value={newAd.city}
                onChange={e => setNewAd(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={submitAd} disabled={!newAd.title.trim() || submitting}>
              {submitting ? 'Dodaję...' : 'Opublikuj ogłoszenie →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
