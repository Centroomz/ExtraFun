import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { calculateDistance, formatDistance } from '../lib/geo'

// ─── TYPE CONFIG (DB uses English keys) ───────────────────────────────────────
const TYPE_CONFIG = {
  club:      { label: 'Klub',    color: '#e9c176', bg: 'rgba(233,193,118,0.12)',   icon: '🎭' },
  sauna:     { label: 'Sauna',   color: '#9D4EDE', bg: 'rgba(157,78,221,0.12)', icon: '♨️' },
  bar:       { label: 'Bar',     color: '#9D4EDE', bg: 'rgba(157,78,222,0.12)',   icon: '🍸' },
  dungeon:   { label: 'Dungeon', color: '#FF4500', bg: 'rgba(255,69,0,0.12)',    icon: '⛓️' },
  spa:       { label: 'Spa',     color: '#00FF96', bg: 'rgba(0,255,150,0.12)',   icon: '🛁' },
  party:     { label: 'Impreza', color: '#FFA500', bg: 'rgba(255,165,0,0.12)',   icon: '🎉' },
  other:     { label: 'Inne',    color: '#888',    bg: 'rgba(136,136,136,0.12)', icon: '📍' },
}

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other
}

// ─── STATIC ARTICLE CONTENT ───────────────────────────────────────────────────
const ARTICLES = [
  {
    id: 'top10-europa',
    hero: true,
    emoji: '🏆',
    tag: 'Ranking',
    tagColor: '#FFD700',
    title: 'TOP 10 Klubów Lifestyle w Europie 2025',
    lead: 'Najlepsze miejsca do swingowania i fetyszu w Berlinie, Amsterdamie, Paryżu i nie tylko.',
    city: 'Europa',
    readTime: '5 min',
    content: [
      { h: 'Jak tworzyliśmy ranking?' },
      { p: 'Ranking powstał na podstawie opinii społeczności, liczby aktywnych gości, różnorodności eventów i standardu obsługi. Odwiedziliśmy lub przeanalizowaliśmy ponad 80 miejsc w 12 krajach.' },
      { h: '#1 – Berghain/Lab.oratory (Berlin)' },
      { p: 'Legendarny klub techno z piwniczą przestrzenią Lab.oratory – fetysz, darkroom, brak tabletów. Dla zaawansowanych tylko. Wejście tylko dla wybranych, dress code fetyszowy.' },
      { h: '#2 – Yolanda (Amsterdam)' },
      { p: 'Największy swingers club w Holandii. Ponad 1500 m², baseny, sauny, playrooms na każdym poziomie. Otwarty codziennie, pary i single.' },
      { h: '#3 – Chéri(e) (Paryż)' },
      { p: 'Ekskluzywny paryski swingers club z restauracją i cocktail barem. Surowy dress code – pary mile widziane, single mężczyźni tylko z zaproszeniem.' },
      { h: '#4 – Lava Club (Warszawa)' },
      { p: '1600 m² w Polsce? Tak – Lava to jeden z największych swingers clubów w Europie Wschodniej. Jacuzzi, playrooms, tematyczne imprezy każdego weekendu.' },
      { h: '#5–10: Reszta stawki' },
      { p: 'Na kolejnych miejscach znalazły się: Insomnia (Bruksela), Contact (Amsterdam), Swingers Heaven (Praga), Taboo (Zurych), Le 16 (Lyon) i Bizarre (Madryt).' },
    ],
  },
  {
    id: 'warszawa-guide',
    emoji: '🇵🇱',
    tag: 'Polska',
    tagColor: '#E63946',
    title: 'Warszawa: Przewodnik po Scenie Lifestyle',
    lead: '5 miejsc, które tworzą podziemną scenę swingowania i fetyszu w polskiej stolicy.',
    city: 'Warszawa',
    readTime: '4 min',
    content: [
      { h: 'Warszawa – niespodziewana stolica stylu życia' },
      { p: 'Warszawa ma jedną z najdynamiczniej rozwijających się scen lifestyle w Europie Wschodniej. Dyskrecja, wysoki standard i różnorodność – to czym zachwyca przyjezdnych.' },
      { h: 'Lava Club – flagowy swingers club' },
      { p: 'Ul. Józefa Strusia 5 – 1600 m² rozrywki dla par i sympatyków seksu grupowego. Jacuzzi, klimatyczne playrooms, tematyczne imprezy w każdy piątek i sobotę.' },
      { h: 'Bizarriusz – kino erotyczne i klub' },
      { p: 'Hoża 41/z, centrum Warszawy – legendarny klub czynny codziennie (oprócz niedzieli) od 14:00. Codziennie różne imprezy: Sex Party, Gang Bang, Naked. Wejście dyskretne od podwórza.' },
      { h: 'Sauny dla swingers: Galla, Heaven, Utopia' },
      { p: 'Sauna Galla (Ptasia 2) – popularne niedziele dla swingers. Sauna Heaven (Waliców 13) – gay sauna z Bi Day we wtorki. Sauna Utopia (Urwisko 12) – mixed crowd dla par.' },
      { h: 'Praktyczne wskazówki' },
      { p: 'Większość miejsc wymaga rejestracji online lub rezerwacji miejsca. Pary zawsze mile widziane. Single mężczyźni – zadzwoń lub sprawdź regulamin przed wizytą. Dress code obowiązuje w Lava i Bizarriusz.' },
    ],
  },
  {
    id: 'berlin-guide',
    emoji: '🇩🇪',
    tag: 'Europa',
    tagColor: '#e9c176',
    title: 'Berlin: Stolica Swingingu Europy',
    lead: 'Ponad 20 klubów, darkroomy, fetysz i wolność – dlaczego Berlin przyciąga co roku tysiące swingersów z całego świata.',
    city: 'Berlin',
    readTime: '4 min',
    content: [
      { h: 'Dlaczego Berlin?' },
      { p: 'Liberalne prawo, otwarta kultura i ogromna społeczność – Berlin od lat 90. jest europejskim centrum sceny lifestyle i fetyszu. Tylko tutaj znajdziesz tak gęstą koncentrację miejsc na km².' },
      { h: 'KitKatClub – legenda w akcji' },
      { p: 'Sobotnia impreza Carneball Bizarre to jedno z najsłynniejszych wydarzeń fetyszowych na świecie. Dress code absolutnie egzekwowany, darkroom na 3 poziomach, pełna swoboda.' },
      { h: 'Lab.oratory (Berghain)' },
      { p: 'Piwnica Berghainu to Lab.oratory – otwarty w weekendy dla miłośników fetyszu i hard play. Jedno z najbardziej selekcjonowanych miejsc na Ziemi.' },
      { h: 'Reszta sceny: FM, SchwuZ, Insomnia' },
      { p: 'Fetisch Melanege (FM) to comiesięczne imprezy tematyczne. SchwuZ – queerowa przestrzeń z playrooms. Insomnia – prywatne imprezy dla par, bardzo eleganckie.' },
      { h: 'Jak się przygotować?' },
      { p: 'Berlińskie kluby są surowe w kwestii dress code. Skóra, lateks, mundury, nagie ciało – tak. Jeansy i podkoszulek – nie. Sprawdź zasady każdego miejsca przed wyjazdem.' },
    ],
  },
]

// ─── ARTICLE READER ────────────────────────────────────────────────────────────
function ArticleReader({ article, onBack }) {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}
        >←</button>
        <h1 style={{ fontSize: 16 }}>Artykuł</h1>
      </div>
      <div style={{ padding: '0 0 80px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(157,78,221,0.3), rgba(233,193,118,0.15))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 20px 24px',
          marginBottom: 0,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{article.emoji}</div>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: article.tagColor, background: `${article.tagColor}22`,
            border: `1px solid ${article.tagColor}44`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em',
          }}>{article.tag} · {article.readTime} czytania</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 900, lineHeight: 1.25, marginBottom: 12 }}>{article.title}</h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 }}>{article.lead}</p>
        </div>
        {/* Body */}
        <div style={{ padding: '24px 20px' }}>
          {article.content.map((block, i) =>
            block.h ? (
              <h3 key={i} style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 800, marginTop: i === 0 ? 0 : 28, marginBottom: 10, color: 'var(--text)' }}>
                {block.h}
              </h3>
            ) : (
              <p key={i} style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.75, marginBottom: 16 }}>
                {block.p}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── VENUE DETAIL ──────────────────────────────────────────────────────────────
function VenueDetail({ venue, onBack }) {
  const t = getTypeConfig(venue.type)
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}
        >←</button>
        <h1 style={{ fontSize: 16 }}>Szczegóły</h1>
      </div>
      <div style={{ padding: '0 0 80px' }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: venue.logo_url ? '#000' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {venue.logo_url
                ? <img src={venue.logo_url} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8, boxSizing: 'border-box' }} />
                : <span style={{ fontSize: 34 }}>{t.icon}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>{venue.name}</h2>
              {venue.distance != null && (
                <span className="venue-card-distance">{formatDistance(venue.distance)}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="venue-type-badge" style={{ background: t.bg, color: t.color }}>
              {t.icon} {t.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>📍 {venue.city}</span>
          </div>
          {venue.description && (
            <p style={{ fontSize: 15, color: '#fff', lineHeight: 1.7, marginBottom: 20 }}>
              {venue.description}
            </p>
          )}
          {venue.events && venue.events.length > 0 && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>📅 Najbliższe dni</div>
              {(() => {
                const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
                const MIES = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
                const today = new Date()
                return [0, 1, 2, 3, 4, 5, 6].map(off => {
                  const d = new Date(today); d.setDate(d.getDate() + off)
                  const dow = d.getDay()
                  const dymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  const special = (venue.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === dymd)
                  const evs = venue.events.filter(e => e.day_of_week === dow)
                  const label = off === 0 ? 'Dziś' : off === 1 ? 'Jutro'
                    : `${DNI[dow][0].toUpperCase()}${DNI[dow].slice(1)} ${d.getDate()} ${MIES[d.getMonth()]}`
                  const isToday = off === 0
                  return (
                    <div key={off} style={{ marginBottom: 12, paddingLeft: isToday ? 10 : 0, borderLeft: isToday ? '3px solid #e9c176' : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#e9c176' : 'var(--text)', marginBottom: 4 }}>
                        {label}{off > 1 ? '' : ` · ${DNI[dow]} ${d.getDate()} ${MIES[d.getMonth()]}`}
                      </div>
                      {special ? (
                        <div style={{ fontSize: 13.5, color: '#fff', lineHeight: 1.55 }}>
                          <strong style={{ color: '#FFC824' }}>⭐ {special.event_name}</strong>
                          {(special.start_time || special.end_time) && <> · {special.start_time}{special.end_time ? `–${special.end_time}` : ''}</>}
                          {special.price && <><br /><span style={{ fontSize: 13, fontWeight: 600 }}>{special.price}</span></>}
                        </div>
                      ) : evs.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', opacity: .6 }}>Zamknięte</div>
                      ) : evs.map(e => (
                        <div key={e.id} style={{ fontSize: 13.5, color: '#fff', lineHeight: 1.55, marginBottom: 3 }}>
                          <strong style={{ color: 'var(--text)' }}>{e.event_name}</strong>
                          {e.audience && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#e9c176', background: 'rgba(233,193,118,.12)', padding: '1px 6px', borderRadius: 6 }}>{e.audience}</span>}
                          {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
                          {e.price && <><br /><span style={{ fontSize: 13, fontWeight: 600 }}>{e.price}</span></>}
                        </div>
                      ))}
                    </div>
                  )
                })
              })()}
            </div>
          )}
          {(!venue.events || venue.events.length === 0) && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                📅 Klub eventowy — terminy i ceny zmieniają się. Sprawdź aktualne imprezy {venue.website ? 'na stronie poniżej.' : 'u źródła.'}
              </div>
            </div>
          )}
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: venue.website ? 10 : 0 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 14, color: '#fff' }}>{venue.address}</span>
            </div>
            {venue.website && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🌐</span>
                <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#e9c176', wordBreak: 'break-all' }}>{venue.website}</a>
              </div>
            )}
          </div>
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

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({ article, hero, onClick }) {
  if (hero) {
    return (
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(157,78,221,0.25) 0%, rgba(233,193,118,0.15) 100%)',
          border: '1px solid rgba(157,78,221,0.35)',
          borderRadius: 18,
          padding: '24px 20px 20px',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 80, opacity: 0.12 }}>🏆</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
            color: article.tagColor, background: `${article.tagColor}22`,
            border: `1px solid ${article.tagColor}44`,
            borderRadius: 20, padding: '3px 10px',
          }}>{article.tag}</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{article.readTime} czytania</span>
        </div>
        <div style={{ fontFamily: 'Outfit', fontSize: 21, fontWeight: 900, lineHeight: 1.25, marginBottom: 10, color: 'var(--text)' }}>
          {article.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{article.lead}</div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#9D4EDE' }}>Czytaj dalej →</span>
        </div>
      </div>
    )
  }
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 14px',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{article.emoji}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
        color: article.tagColor, marginBottom: 6,
      }}>{article.tag}</div>
      <div style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 800, lineHeight: 1.3, marginBottom: 6, color: 'var(--text)' }}>
        {article.title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
        {article.lead.slice(0, 80)}…
      </div>
    </div>
  )
}

// ─── City helpers ─────────────────────────────────────────────────────────────
function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
const PL_CITY_SET = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź', 'Katowice', 'Sopot', 'Szczecin', 'Lublin', 'Czeladź', 'Lubliniec']

// One venue row (used in city listings + "blisko Ciebie"). `venue` carries the
// attached day status (_special / _dayEvents / _eventClub).
function VenueRow({ venue, onClick }) {
  const t = getTypeConfig(venue.type)
  return (
    <div className="venue-card" onClick={onClick} style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: venue.logo_url ? '#000' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {venue.logo_url
          ? <img src={venue.logo_url} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6, boxSizing: 'border-box' }} />
          : <span style={{ fontSize: 26 }}>{t.icon}</span>}
      </div>
      <div className="venue-card-body" style={{ flex: 1, minWidth: 0, padding: 0 }}>
        <div className="venue-card-top">
          <div className="venue-card-name">{venue.name}</div>
          {venue.distance != null && <span className="venue-card-distance">{formatDistance(venue.distance)}</span>}
        </div>
        <div className="venue-card-meta">
          <span className="venue-type-badge" style={{ background: t.bg, color: t.color }}>{t.label}</span>
          <span>📍 {venue.city}</span>
        </div>
        {venue._special ? (
          <div style={{ fontSize: 12.5, color: '#fff', lineHeight: 1.45, marginTop: 6 }}>
            <strong style={{ color: '#FFC824' }}>⭐ {venue._special.event_name}</strong>
            {(venue._special.start_time || venue._special.end_time) && <> · {venue._special.start_time}{venue._special.end_time ? `–${venue._special.end_time}` : ''}</>}
            {venue._special.price && <> · {venue._special.price}</>}
          </div>
        ) : venue._eventClub ? (
          <div style={{ fontSize: 12.5, color: '#e9c176', marginTop: 6, fontWeight: 600 }}>🟢 Otwarte — sprawdź imprezę na stronie</div>
        ) : (venue._dayEvents && venue._dayEvents.length > 0) ? (
          <div style={{ marginTop: 6 }}>
            {venue._dayEvents.map(e => (
              <div key={e.id} style={{ fontSize: 12.5, color: '#fff', lineHeight: 1.45, marginBottom: 2 }}>
                <strong style={{ color: 'var(--text)' }}>{e.event_name}</strong>
                {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
                {e.price && <> · {e.price}</>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>Dziś nieczynne</div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function Przewodnik({ city: cityParam }) {
  const [, navigate] = useLocation()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCity, setActiveCity] = useState('all') // show all cities by default (GPS narrows to distance)
  const [activeType, setActiveType] = useState('all')
  const [dayOffset, setDayOffset] = useState(0)   // 0=dziś, 1=jutro, 2=pojutrze
  const [scene, setScene] = useState('all')        // 'all' | 'swing' | 'lgbt' — show everything by default
  const [radiusKm, setRadiusKm] = useState(Infinity) // GPS scope; Infinity = all, sorted by distance
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
  const geoApplied = useRef(false)

  useEffect(() => {
    loadVenues()
    requestLocation()
  }, [])

  // When GPS first arrives, switch to radius mode (all cities, ≤ radiusKm).
  useEffect(() => {
    if (location && !geoApplied.current) { geoApplied.current = true; setActiveCity('all') }
  }, [location])

  // Open a venue/article = a history entry, so the hardware/gesture Back closes
  // the detail and returns to the list instead of leaving the page.
  useEffect(() => {
    if (selectedVenue == null && selectedArticle == null) return
    window.history.pushState({ efDetail: true }, '')
    const onPop = () => { setSelectedVenue(null); setSelectedArticle(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [selectedVenue, selectedArticle])

  async function loadVenues() {
    try {
      const data = await apiFetch('/api/places')
      if (data && data.length > 0) {
        // normalize to lat/lng for distance calc
        setVenues(data.map(v => ({ ...v, lat: v.latitude, lng: v.longitude })))
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  // Distance sorting
  const venuesWithDist = location
    ? venues.map(v => ({
        ...v,
        distance: v.lat && v.lng
          ? calculateDistance(location.lat, location.lng, parseFloat(v.lat), parseFloat(v.lng))
          : null,
      })).sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    : venues

  // Unique cities
  const cities = ['all', ...Array.from(new Set(venues.map(v => v.city))).sort()]

  // Polish cities first
  const PL_CITIES = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź']
  const sortedCities = ['all', ...cities.filter(c => c !== 'all').sort((a, b) => {
    const apl = PL_CITIES.includes(a)
    const bpl = PL_CITIES.includes(b)
    if (apl && !bpl) return -1
    if (!apl && bpl) return 1
    return a.localeCompare(b, 'pl')
  })]

  // Client-centric: show what's ON the chosen day, near me.
  const _targetDate = new Date(); _targetDate.setDate(_targetDate.getDate() + dayOffset)
  const targetDow = _targetDate.getDay()
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const targetYmd = ymd(_targetDate)
  const sceneOk = v => scene === 'all' || v.scene === scene || v.scene === 'mixed'
  const filtered = venuesWithDist
    // Scope: a chosen city → that city; otherwise, with GPS → within radiusKm.
    .filter(v => {
      if (activeCity !== 'all') return v.city === activeCity
      if (location && radiusKm !== Infinity) return v.distance != null && v.distance <= radiusKm
      return true
    })
    .filter(v => activeType === 'all' || v.type === activeType)
    .filter(sceneOk)
    .map(v => {
      const evs = v.events || []
      // A dated special on that exact date overrides the weekly schedule.
      const special = (v.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === targetYmd)
      return { ...v, _special: special, _dayEvents: evs.filter(e => e.day_of_week === targetDow), _eventClub: evs.length === 0 }
    })
    // Open that day: special OR weekly event OR event-club (no fixed schedule).
    .filter(v => v._special || v._dayEvents.length > 0 || v._eventClub)

  const types = ['all', ...Array.from(new Set(venues.map(v => v.type))).sort()]

  // Attach the chosen day's status to a venue (special / weekly / event-club).
  const statusOf = (v) => {
    const evs = v.events || []
    const special = (v.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === targetYmd)
    return { ...v, _special: special, _dayEvents: evs.filter(e => e.day_of_week === targetDow), _eventClub: evs.length === 0 }
  }
  const isOpenToday = (v) => v._special || (v._dayEvents && v._dayEvents.length > 0) || v._eventClub

  // City hub data
  const cityCounts = {}
  venues.forEach(v => { cityCounts[v.city] = (cityCounts[v.city] || 0) + 1 })
  const plCount = venues.filter(v => PL_CITY_SET.includes(v.city)).length
  const foreignCities = Object.keys(cityCounts)
    .filter(c => !PL_CITY_SET.includes(c))
    .sort((a, b) => cityCounts[b] - cityCounts[a])

  // "Blisko Ciebie" — open today, within range, nearest first (only with GPS)
  const nearby = location
    ? venuesWithDist.map(statusOf).filter(sceneOk).filter(isOpenToday)
        .filter(v => radiusKm === Infinity || (v.distance != null && v.distance <= radiusKm))
        .slice(0, 8)
    : []

  // City page resolution
  const isPolska = cityParam === 'polska'
  const cityName = isPolska ? 'Polska' : (Object.keys(cityCounts).find(c => slugify(c) === cityParam) || cityParam)
  const cityVenues = venuesWithDist
    .filter(v => isPolska ? PL_CITY_SET.includes(v.city) : v.city === cityName)
    .map(statusOf)
    .filter(sceneOk)
    .filter(v => activeType === 'all' || v.type === activeType)
    .sort((a, b) => {
      if (location && a.distance != null && b.distance != null) return a.distance - b.distance
      return String(a.name).localeCompare(String(b.name), 'pl')
    })

  // Views
  if (selectedArticle) {
    return <ArticleReader article={selectedArticle} onBack={() => window.history.back()} />
  }
  if (selectedVenue) {
    const v = venuesWithDist.find(v => v.id === selectedVenue)
    if (v) return <VenueDetail venue={v} onBack={() => window.history.back()} />
  }

  return (
    <div>
      <Helmet>
        <title>Przewodnik po klubach lifestyle – swing, BDSM, fetysz | ExtraFun</title>
        <meta name="description" content="Mapa i lista klubów lifestyle, swing i BDSM w Polsce. Znajdź miejsce blisko siebie — filtruj po mieście, typie i dniu tygodnia." />
        <link rel="canonical" href="https://extrafun.pl/miejsca" />
      </Helmet>
      {cityParam ? (
        /* ════════ CITY PAGE ════════ */
        <>
          <div style={{ padding: '20px 16px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/miejsca')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 24, padding: 0, lineHeight: 1 }}>←</button>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: 'var(--text)' }}>
              {isPolska ? '🇵🇱 Polska' : cityName}
            </h1>
          </div>
          <p style={{ padding: '0 16px 6px', fontSize: 13, color: 'var(--text-dim)' }}>
            {loading ? 'Ładowanie…' : `${cityVenues.length} ${cityVenues.length === 1 ? 'lokal' : 'lokali'} · ${dayOffset === 0 ? 'dziś' : dayOffset === 1 ? 'jutro' : 'pojutrze'}`}
          </p>

          <div className="category-filter" style={{ marginBottom: 8 }}>
            {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
              <button key={off} className={`category-chip ${dayOffset === off ? 'active' : ''}`} onClick={() => setDayOffset(off)}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : cityVenues.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏙️</div><div className="empty-title">Brak lokali</div></div>
          ) : (
            <div className="venue-list" style={{ paddingBottom: 80 }}>
              {cityVenues.map(v => <VenueRow key={v.id} venue={v} onClick={() => setSelectedVenue(v.id)} />)}
            </div>
          )}
        </>
      ) : (
        /* ════════ HUB ════════ */
        <>
          {/* Top 10 */}
          <div style={{ padding: '24px 16px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan)' }}>Polecane</div>
          <div style={{ padding: '0 16px' }}>
            <ArticleCard article={ARTICLES[0]} hero onClick={() => setSelectedArticle(ARTICLES[0])} />
          </div>
          <div style={{ padding: '10px 16px 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Polska i Europa</div>
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 24 }}>
            {ARTICLES.slice(1).map(a => <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />)}
          </div>

          {/* Blisko Ciebie (GPS) */}
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 8px', color: 'var(--text)' }}>📍 Blisko Ciebie</h2>
            <div style={{ padding: '12px 14px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: location ? 'rgba(233,193,118,0.08)' : 'var(--glass)', border: `1px solid ${location ? 'rgba(233,193,118,0.3)' : 'var(--glass-border)'}` }}>
              <span style={{ fontSize: 16 }}>📡</span>
              <span style={{ flex: 1, minWidth: 150, fontSize: 13, color: 'var(--text-dim)' }}>
                {geoLoading ? 'Szukam lokalizacji…' :
                 location ? <><strong style={{ color: 'var(--cyan)' }}>GPS aktywny</strong> — najbliższe otwarte dziś</> :
                 geoError ? geoError :
                 'Włącz GPS — pokażę co jest blisko'}
              </span>
              {!location && !geoLoading && <button className="location-bar-btn" onClick={requestLocation}>{geoError ? 'Ponów' : 'Włącz GPS'}</button>}
            </div>
          </div>
          {location && nearby.length > 0 && (
            <div className="venue-list" style={{ marginBottom: 20 }}>
              {nearby.map(v => <VenueRow key={v.id} venue={v} onClick={() => setSelectedVenue(v.id)} />)}
            </div>
          )}

          {/* City cards */}
          <div style={{ padding: '0 16px 8px', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Przeglądaj wg miasta</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 80px' }}>
            {[{ label: '🇵🇱 Polska', count: plCount, slug: 'polska' }, ...foreignCities.map(c => ({ label: c, count: cityCounts[c], slug: slugify(c) }))].map(cardItem => (
              <div key={cardItem.slug} onClick={() => navigate('/miejsca/' + cardItem.slug)}
                style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 14px', transition: 'border-color .2s' }}>
                <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{cardItem.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{cardItem.count} {cardItem.count === 1 ? 'lokal' : 'lokali'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
