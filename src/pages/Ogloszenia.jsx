import { useState, useEffect, useMemo } from 'react'
import { useLocation, Link } from 'wouter'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { sortByDistance, formatDistance } from '../lib/geo'
import { Button, Hero } from '../components/nocturne'

// Real shared-pool categories (posting). Filters are derived from live data below.
const POST_CATEGORIES = [
  'Pan szuka Pani', 'Pani szuka Pana', 'Para', 'Pani', 'Pan', 'Bi', 'Trans/CD',
  'Swing', 'BDSM/Fetysz', 'Cuckold', 'Na dziś', 'Znajomości', 'Związek', 'Inne',
]

const CAT_EMOJI = {
  'Pan szuka Pani': '🚹', 'Pani szuka Pana': '🚺', 'Para': '💑', 'Pani': '🌹',
  'Pan': '🎩', 'Bi': '💫', 'Trans/CD': '⚧️', 'Swing': '🔥', 'BDSM/Fetysz': '⛓️',
  'Cuckold': '👀', 'Na dziś': '⚡', 'Znajomości': '🤝', 'Związek': '❤️',
  'Gej': '🏳️‍🌈', 'LGBT': '🏳️‍🌈', 'GB': '🔥', 'Shibari': '🪢', 'Gilf': '🌹', 'Połyk': '💋',
}
const catEmoji = (c) => CAT_EMOJI[c] || '📌'
const GAY_CATS = ['Gej', 'LGBT']

const DEMO_ADS = [
  { id: '1', category: 'Para', title: 'Para bi poszukuje kobiety do tria', description: 'Otwarta para (35/33) szuka biseksualnej kobiety. Cenimy komunikację i szacunek.', city: 'Warszawa', created_at: new Date(Date.now() - 2*3600000).toISOString(), author_name: 'Para_WAW' },
  { id: '2', category: 'Swing', title: 'Prywatna impreza swingerska – sobota 22:00', description: 'Dyskretna impreza w prywatnym domu. 10-15 par. Dress code elegancki. Weryfikacja telefoniczna.', city: 'Kraków', created_at: new Date(Date.now() - 5*3600000).toISOString(), author_name: 'Host_Krakow' },
  { id: '3', category: 'Bi', title: 'Singl bi (28) szuka pary lub osoby do zabaw', description: 'Biseksualny mężczyzna, 28, Wrocław. Pary lub single do regularnych spotkań.', city: 'Wrocław', created_at: new Date(Date.now() - 8*3600000).toISOString(), author_name: 'Alex_WRO' },
]

const chip = (active) =>
  `font-body text-label-caps uppercase pb-1 border-b-2 transition-colors whitespace-nowrap ${
    active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
  }`

function AdDetail({ ad, onBack, user, onDeleted }) {
  const [, navigate] = useLocation()
  const [compose, setCompose] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const canMessage = !!ad.author_uuid
  const isOwner = !!(user && ad.author_uuid && user.id === ad.author_uuid)

  async function del() {
    if (deleting || !confirm('Usunąć to ogłoszenie?')) return
    setDeleting(true)
    try {
      await apiFetch(`/api/ads/${ad.id}`, { method: 'DELETE' })
      onDeleted?.()
    } catch (e) {
      alert('Nie udało się usunąć: ' + (e.message || ''))
      setDeleting(false)
    }
  }

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
          <span className="text-primary-container">{catEmoji(ad.category)} {ad.category || 'Ogłoszenie'}</span>
          {ad.distance != null && <span className="text-outline">{formatDistance(ad.distance)}</span>}
        </div>

        <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-tight mb-4">{ad.title}</h1>

        <div className="flex flex-wrap gap-4 font-body text-body-md text-on-surface-variant mb-8">
          <span>👤 {ad.author_name || 'Użytkownik'}</span>
          {ad.city && <span>📍 {ad.city}</span>}
          <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
        </div>

        <p className="font-body text-body-lg text-on-surface leading-relaxed mb-10 whitespace-pre-line">{ad.description}</p>

        <div className="flex items-center gap-6">
          {isOwner ? (
            <button onClick={del} disabled={deleting}
              className="font-body text-label-caps uppercase text-red-400 hover:text-red-300 disabled:opacity-50">
              {deleting ? 'Usuwam…' : 'Usuń ogłoszenie'}
            </button>
          ) : !user ? (
            <Button onClick={() => navigate('/login')}>Zaloguj się, aby napisać</Button>
          ) : canMessage ? (
            <Button onClick={() => { setSent(false); setCompose(true) }}>Napisz wiadomość</Button>
          ) : (
            <span className="font-body text-body-md text-on-surface-variant">Ogłoszenie demonstracyjne — kontakt niedostępny</span>
          )}
          {!isOwner && <button className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface">Zgłoś</button>}
        </div>
      </main>

      {compose && (
        <div className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !sending && setCompose(false)} />
          <div className="relative w-full md:max-w-lg bg-surface-container-low border border-outline-variant/20 p-6 pb-[calc(var(--nav-height)_+_env(safe-area-inset-bottom)_+_1.5rem)] md:pb-6 max-h-[90vh] overflow-y-auto">
            <div className="font-display font-semibold text-headline-sm text-on-surface mb-1">Napisz wiadomość</div>
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
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedAd, setSelectedAd] = useState(null)
  const [showNewAd, setShowNewAd] = useState(false)
  const [newAd, setNewAd] = useState({ type: 'Pan szuka Pani', title: '', description: '', city: '' })
  const [submitting, setSubmitting] = useState(false)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => { loadAds() }, [])

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
      setNewAd({ type: 'Pan szuka Pani', title: '', description: '', city: '' })
      setShowNewAd(false)
      loadAds()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // Category chips derived from live data — count per category, most common first.
  const categories = useMemo(() => {
    const counts = {}
    for (const a of ads) { const c = a.category || 'Inne'; counts[c] = (counts[c] || 0) + 1 }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([c, n]) => ({ c, n }))
  }, [ads])

  let displayAds = location ? sortByDistance(ads, location.lat, location.lng) : ads
  if (activeCategory !== 'all') displayAds = displayAds.filter(a => (a.category || 'Inne') === activeCategory)
  const q = search.trim().toLowerCase()
  if (q) displayAds = displayAds.filter(a =>
    (a.title || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q) || (a.city || '').toLowerCase().includes(q))

  if (selectedAd) {
    const ad = displayAds.find(a => a.id === selectedAd) || ads.find(a => a.id === selectedAd)
    if (ad) return <AdDetail ad={ad} onBack={() => setSelectedAd(null)} user={user}
      onDeleted={() => { setSelectedAd(null); loadAds() }} />
  }

  const inputCls = 'w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50'
  const showGayBanner = GAY_CATS.includes(activeCategory)

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Hero
        image="/editorial/hero-ogloszenia.jpg"
        label="OD SPOŁECZNOŚCI"
        title="Ogłoszenia"
        lead="Anonse od ludzi z naszej sceny — pary, single, wydarzenia, fetysz."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {user && (
          <div className="flex justify-end mb-4">
            <Link href="/wiadomosci">
              <span className="font-body text-label-caps uppercase text-primary-container hover:opacity-80 cursor-pointer whitespace-nowrap inline-block">Wiadomości →</span>
            </Link>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj w ogłoszeniach — nick, miasto, treść…"
            className={inputCls}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Wyczyść"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">✕</button>
          )}
        </div>

        {/* Category filter — real categories from the shared pool */}
        <div className="flex flex-nowrap md:flex-wrap gap-x-6 gap-y-3 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
          <button className={chip(activeCategory === 'all')} onClick={() => setActiveCategory('all')}>Wszystkie</button>
          {categories.map(({ c, n }) => (
            <button key={c} className={chip(activeCategory === c)} onClick={() => setActiveCategory(c)}>
              {catEmoji(c)} {c} <span className="opacity-50">{n}</span>
            </button>
          ))}
        </div>

        {/* Cross-portal banner — gay/LGBT ads live mostly on gay.pl */}
        {showGayBanner && (
          <a href="https://www.gay.pl/ogloszenia?utm_source=extrafun&utm_medium=ads_banner" target="_blank" rel="noopener noreferrer"
            className="group block mb-8 p-6 border border-primary-container/40 hover:border-primary-container transition-colors"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))' }}>
            <div className="flex items-center gap-4">
              <span className="text-4xl shrink-0">🏳️‍🌈</span>
              <div className="flex-1 min-w-0">
                <div className="font-body text-label-caps uppercase text-primary-container mb-1">Ogłoszenia gej</div>
                <div className="font-display text-headline-sm text-on-surface leading-tight">Więcej anonsów gej znajdziesz na gay.pl</div>
                <div className="font-body text-body-md text-on-surface-variant mt-1">Pełny katalog ogłoszeń LGBT+ — pary, single, znajomości.</div>
              </div>
              <span className="font-body text-label-caps uppercase text-primary-container shrink-0 group-hover:translate-x-1 transition-transform">gay.pl →</span>
            </div>
          </a>
        )}

        {/* List */}
        {loading ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : displayAds.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display text-headline-sm text-on-surface mb-2">Brak ogłoszeń</div>
            <div className="font-body text-body-md text-on-surface-variant">Nie znaleziono ogłoszeń spełniających kryteria.</div>
          </div>
        ) : (
          <div>
            <div className="font-body text-label-caps uppercase text-outline mb-4">{displayAds.length} {displayAds.length === 1 ? 'ogłoszenie' : 'ogłoszeń'}</div>
            {displayAds.map(ad => (
              <div key={ad.id} onClick={() => setSelectedAd(ad.id)} className="group py-5 border-b border-outline-variant/15 cursor-pointer">
                <div className="flex items-center justify-between gap-3 mb-1.5 font-body text-label-caps uppercase">
                  <span className="text-primary-container">{catEmoji(ad.category)} {ad.category || 'Ogłoszenie'}</span>
                  {ad.distance != null && <span className="text-outline">{formatDistance(ad.distance)}</span>}
                </div>
                <div className="font-body font-semibold text-body-lg text-on-surface leading-snug group-hover:text-primary-container transition-colors">{ad.title}</div>
                <div className="font-body text-body-md text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{ad.description}</div>
                <div className="flex flex-wrap gap-4 mt-2 font-body text-label-caps uppercase text-outline">
                  <span>👤 {ad.author_name || 'Użytkownik'}</span>
                  {ad.city && <span>📍 {ad.city}</span>}
                  <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location — optional, secondary (only 13/343 ads have coordinates) */}
        <div className="mt-12 flex items-center gap-4 flex-wrap p-4 border border-outline-variant/20">
          <span className="flex-1 min-w-[150px] font-body text-body-sm text-on-surface-variant">
            {geoLoading ? 'Szukam lokalizacji…' :
             location ? 'Lokalizacja aktywna — sortuję po odległości (jeśli podana)' :
             'Sortuj po odległości (opcjonalnie)'}
          </span>
          {!location && !geoLoading && (
            <button onClick={requestLocation} className="font-body text-label-caps uppercase text-primary-container hover:opacity-80">
              {geoError ? 'Ponów' : '📍 Włącz GPS'}
            </button>
          )}
        </div>
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
            <div className="font-display font-semibold text-headline-sm text-on-surface mb-6">Dodaj ogłoszenie</div>

            <label className="block font-body text-label-caps uppercase text-outline mb-1">Kategoria</label>
            <select className={`${inputCls} mb-4`} value={newAd.type} onChange={e => setNewAd(prev => ({ ...prev, type: e.target.value }))}>
              {POST_CATEGORIES.map(c => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
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
