import { useState, useEffect } from 'react'
import { useLocation, Link } from 'wouter'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'
import { Button, Hero } from '../components/nocturne'

const TYPES = [
  { id: 'looking', label: 'Szukam', emoji: '🔍' },
  { id: 'event', label: 'Wydarzenie', emoji: '🎉' },
  { id: 'sale', label: 'Sprzedaż', emoji: '🛍️' },
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

const chip = (active) =>
  `font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
    active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
  }`

function typeLabel(id) {
  const t = TYPES.find(x => x.id === id) || TYPES[0]
  return `${t.emoji} ${t.label}`
}

function AdDetail({ ad, onBack, user }) {
  const [, navigate] = useLocation()
  const [compose, setCompose] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const canMessage = !!ad.author_uuid

  async function send() {
    if (!msg.trim() || sending) return
    setSending(true)
    try {
      await apiFetch('/api/messages', { method: 'POST', body: { ad_id: ad.id, content: msg.trim() } })
      setSent(true); setMsg('')
    } catch (e) { alert('Nie udało się wysłać: ' + (e.message || '')) }
    setSending(false)
  }

  const inputCls = 'w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50'

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <main className="max-w-2xl mx-auto px-6 md:px-16 pt-12 pb-24">
        <button onClick={onBack} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Ogłoszenia</button>

        <div className="flex items-center gap-4 mb-4 font-body text-label-caps uppercase">
          <span className="text-primary-container">{typeLabel(ad.type)}</span>
          {ad.distance != null && <span className="text-outline">{formatDistance(ad.distance)}</span>}
        </div>

        <h1 className="font-display italic font-semibold text-display-lg-mobile text-on-surface leading-tight mb-4">{ad.title}</h1>

        <div className="flex flex-wrap gap-4 font-body text-body-md text-on-surface-variant mb-8">
          <span>{ad.author_emoji} {ad.author_name}</span>
          <span>{ad.city}</span>
          <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
        </div>

        <p className="font-body text-body-lg text-on-surface leading-relaxed mb-10">{ad.description}</p>

        <div className="flex items-center gap-6">
          {!user ? (
            <Button onClick={() => navigate('/login')}>Zaloguj się, aby napisać</Button>
          ) : canMessage ? (
            <Button onClick={() => { setSent(false); setCompose(true) }}>Napisz wiadomość</Button>
          ) : (
            <span className="font-body text-body-md text-on-surface-variant">Ogłoszenie demonstracyjne — kontakt niedostępny</span>
          )}
          <button className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface">Zgłoś</button>
        </div>
      </main>

      {compose && (
        <div className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !sending && setCompose(false)} />
          <div className="relative w-full md:max-w-lg bg-surface-container-low border border-outline-variant/20 p-6 pb-[calc(var(--nav-height)_+_env(safe-area-inset-bottom)_+_1.5rem)] md:pb-6 max-h-[90vh] overflow-y-auto">
            <div className="font-display italic font-semibold text-headline-sm text-on-surface mb-1">Napisz wiadomość</div>
            <div className="font-body text-body-md text-on-surface-variant mb-5">Do ogłoszeniodawcy · {ad.title}</div>
            {sent ? (
              <>
                <p className="font-body text-body-md text-on-surface mb-6">Wysłano ✓ Odpowiedź zobaczysz w „Wiadomości".</p>
                <Button onClick={() => { setCompose(false); navigate('/wiadomosci') }}>Przejdź do Wiadomości</Button>
              </>
            ) : (
              <>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Twoja wiadomość…" className={`${inputCls} min-h-[120px] mb-4`} />
                <div className="flex items-center gap-6">
                  <button onClick={send} disabled={!msg.trim() || sending}
                    className="bg-primary-container text-[#1a1400] px-10 py-4 font-body text-label-caps uppercase font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    {sending ? 'Wysyłam…' : 'Wyślij'}
                  </button>
                  <button onClick={() => setCompose(false)} className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface">Anuluj</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
      const data = await apiFetch('/api/ads')
      setAds(data && data.length > 0 ? data : DEMO_ADS)
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
      await apiFetch('/api/ads', { method: 'POST', body: {
        type: newAd.type, title: newAd.title, description: newAd.description, city: newAd.city,
        latitude: location?.lat || null, longitude: location?.lng || null,
      }})
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

  const inputCls = 'w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50'

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Hero
        image="/editorial/hero-ogloszenia.jpg"
        label="OD SPOŁECZNOŚCI"
        title="Ogłoszenia"
        lead="Szukam · wydarzenia · sprzedaż — wpisy od ludzi z naszej sceny."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {user && (
          <div className="flex justify-end mb-6">
            <Link href="/wiadomosci">
              <span className="font-body text-label-caps uppercase text-primary-container hover:opacity-80 cursor-pointer whitespace-nowrap inline-block">Wiadomości →</span>
            </Link>
          </div>
        )}

        {/* Location bar */}
        <div className={`flex items-center gap-4 flex-wrap p-4 border mb-8 ${location ? 'border-primary-container/40' : 'border-outline-variant/30'}`}>
          <span className="flex-1 min-w-[150px] font-body text-body-md text-on-surface-variant">
            {geoLoading ? 'Szukam lokalizacji…' :
             location ? 'Lokalizacja aktywna — sortuję po odległości' :
             'Włącz lokalizację, aby zobaczyć odległości'}
          </span>
          {!location && !geoLoading && <Button onClick={requestLocation}>{geoError ? 'Ponów' : 'Włącz GPS'}</Button>}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-x-7 gap-y-3 mb-6">
          <button className={chip(activeType === 'all')} onClick={() => setActiveType('all')}>Wszystkie</button>
          {TYPES.map(t => (
            <button key={t.id} className={chip(activeType === t.id)} onClick={() => setActiveType(t.id)}>{t.emoji} {t.label}</button>
          ))}
        </div>

        {/* Distance filter */}
        {location && (
          <div className="flex flex-wrap gap-x-7 gap-y-3 mb-10">
            {DISTANCE_FILTERS.map(f => (
              <button key={f.id} className={chip(distanceFilter === f.id)} onClick={() => setDistanceFilter(f.id)}>{f.label}</button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : displayAds.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display italic text-headline-sm text-on-surface mb-2">Brak ogłoszeń</div>
            <div className="font-body text-body-md text-on-surface-variant">Nie znaleziono ogłoszeń spełniających kryteria.</div>
          </div>
        ) : (
          <div>
            {displayAds.map(ad => (
              <div key={ad.id} onClick={() => setSelectedAd(ad.id)} className="group py-5 border-b border-outline-variant/15 cursor-pointer">
                <div className="flex items-center justify-between gap-3 mb-1.5 font-body text-label-caps uppercase">
                  <span className="text-primary-container">{typeLabel(ad.type)}</span>
                  {ad.distance != null && <span className="text-outline">{formatDistance(ad.distance)}</span>}
                </div>
                <div className="font-display italic font-medium text-body-lg text-on-surface leading-tight group-hover:text-primary-container transition-colors">{ad.title}</div>
                <div className="font-body text-body-md text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{ad.description}</div>
                <div className="flex flex-wrap gap-4 mt-2 font-body text-label-caps uppercase text-outline">
                  <span>{ad.author_emoji || '👤'} {ad.author_name || 'Użytkownik'}</span>
                  <span>{ad.city}</span>
                  <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      {user && (
        <button onClick={() => setShowNewAd(true)}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary-container text-[#1a1400] text-2xl font-semibold flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity">
          +
        </button>
      )}

      {/* New ad sheet */}
      {showNewAd && (
        <div className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowNewAd(false)} />
          <div className="relative w-full md:max-w-lg bg-surface-container-low border border-outline-variant/20 p-6 pb-[calc(var(--nav-height)_+_env(safe-area-inset-bottom)_+_1.5rem)] md:pb-6 max-h-[90vh] overflow-y-auto">
            <div className="font-display italic font-semibold text-headline-sm text-on-surface mb-6">Dodaj ogłoszenie</div>

            <label className="block font-body text-label-caps uppercase text-outline mb-1">Typ</label>
            <select className={`${inputCls} mb-4`} value={newAd.type} onChange={e => setNewAd(prev => ({ ...prev, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
            </select>

            <label className="block font-body text-label-caps uppercase text-outline mb-1">Tytuł</label>
            <input className={`${inputCls} mb-4`} placeholder="Tytuł ogłoszenia…" value={newAd.title} onChange={e => setNewAd(prev => ({ ...prev, title: e.target.value }))} />

            <label className="block font-body text-label-caps uppercase text-outline mb-1">Opis</label>
            <textarea className={`${inputCls} mb-4 min-h-[100px]`} placeholder="Szczegółowy opis…" value={newAd.description} onChange={e => setNewAd(prev => ({ ...prev, description: e.target.value }))} />

            <label className="block font-body text-label-caps uppercase text-outline mb-1">Miasto</label>
            <input className={`${inputCls} mb-6`} placeholder="Np. Warszawa" value={newAd.city} onChange={e => setNewAd(prev => ({ ...prev, city: e.target.value }))} />

            <button onClick={submitAd} disabled={!newAd.title.trim() || submitting}
              className="w-full bg-primary-container text-[#1a1400] py-4 font-body text-label-caps uppercase font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Dodaję…' : 'Opublikuj ogłoszenie'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
