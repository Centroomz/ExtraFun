import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { calculateDistance, formatDistance } from '../lib/geo'
import { Hero, Button } from '../components/nocturne'

// ─── TYPE CONFIG (DB uses English keys) ───────────────────────────────────────
const TYPE_CONFIG = {
  club:      { label: 'Klub',    color: '#d4af37', bg: 'rgba(233,193,118,0.12)',   icon: '🎭' },
  sauna:     { label: 'Sauna',   color: '#d4af37', bg: 'rgba(212,175,55,0.12)', icon: '♨️' },
  bar:       { label: 'Bar',     color: '#d4af37', bg: 'rgba(212,175,55,0.12)',   icon: '🍸' },
  dungeon:   { label: 'Dungeon', color: '#FF4500', bg: 'rgba(255,69,0,0.12)',    icon: '⛓️' },
  spa:       { label: 'Spa',     color: '#00FF96', bg: 'rgba(0,255,150,0.12)',   icon: '🛁' },
  party:     { label: 'Impreza', color: '#FFA500', bg: 'rgba(255,165,0,0.12)',   icon: '🎉' },
  plaża:     { label: 'Plaża',   color: '#39c0ed', bg: 'rgba(57,192,237,0.12)',  icon: '🏖️' },
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
    tagColor: '#d4af37',
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
          background: 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(233,193,118,0.10))',
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
          <h2 className="font-display italic font-semibold text-headline-md text-on-surface" style={{ lineHeight: 1.2, marginBottom: 12 }}>{article.title}</h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 }}>{article.lead}</p>
        </div>
        {/* Body */}
        <div className="max-w-2xl" style={{ padding: '24px 20px' }}>
          {article.content.map((block, i) =>
            block.h ? (
              <h3 key={i} className="font-display italic font-medium text-headline-sm text-on-surface" style={{ marginTop: i === 0 ? 0 : 28, marginBottom: 10 }}>
                {block.h}
              </h3>
            ) : (
              <p key={i} className="font-body" style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.75, marginBottom: 16 }}>
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
      <div className="max-w-3xl mx-auto" style={{ padding: '0 0 80px' }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 72, height: 72, flexShrink: 0, background: venue.logo_url ? '#000' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {venue.logo_url
                ? <img src={venue.logo_url} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8, boxSizing: 'border-box' }} />
                : <span style={{ fontSize: 34 }}>{t.icon}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="font-display italic font-semibold text-headline-md text-on-surface">{venue.name}</h2>
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
              <div className="font-display italic font-medium text-headline-sm text-on-surface" style={{ marginBottom: 12 }}>Najbliższe dni</div>
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
                    <div key={off} style={{ marginBottom: 12, paddingLeft: isToday ? 10 : 0, borderLeft: isToday ? '3px solid #d4af37' : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#d4af37' : 'var(--text)', marginBottom: 4 }}>
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
                          {e.audience && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#d4af37', background: 'rgba(233,193,118,.12)', padding: '1px 6px', borderRadius: 6 }}>{e.audience}</span>}
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
                <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#d4af37', wordBreak: 'break-all' }}>{venue.website}</a>
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
      <div onClick={onClick} className="group cursor-pointer border border-outline-variant/20 p-6 hover:border-primary-container/40 transition-colors h-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-body text-label-caps uppercase text-primary-container">{article.tag}</span>
          <span className="font-body text-label-caps uppercase text-outline">{article.readTime} czytania</span>
        </div>
        <div className="font-display italic font-semibold text-headline-md text-on-surface leading-tight mb-3 group-hover:text-primary-container transition-colors">
          {article.title}
        </div>
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{article.lead}</p>
        <div className="mt-6 font-body text-label-caps uppercase text-primary-container">Czytaj dalej →</div>
      </div>
    )
  }
  return (
    <div onClick={onClick} className="group cursor-pointer border border-outline-variant/20 p-5 hover:border-primary-container/40 transition-colors">
      <div className="font-body text-label-caps uppercase text-primary-container mb-2">{article.tag}</div>
      <div className="font-display italic font-medium text-body-lg text-on-surface leading-tight mb-2 group-hover:text-primary-container transition-colors">
        {article.title}
      </div>
      <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{article.lead.slice(0, 80)}…</p>
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

// Per-venue URL slug — id-prefixed (like gay.pl) so each club has its own
// shareable, indexable, AI-citable page: /miejsca/123-heaven-warszawa.
function venueSlug(v) {
  return `${v.id}-${slugify(v.name)}${v.city ? '-' + slugify(v.city) : ''}`
}

// The chosen day's status line (special / weekly events / event-club / closed).
// Shared by the grid card (VenueRow) and the compact hub row (VenueRowCompact).
function VenueStatus({ venue }) {
  if (venue.type === 'plaża') return <span className="font-body text-body-md text-on-surface-variant">Plaża naturystyczna / FKK</span>
  if (venue._special) return (
    <span className="font-body text-body-md text-on-surface">
      <span className="text-primary-container font-semibold">★ {venue._special.event_name}</span>
      {(venue._special.start_time || venue._special.end_time) && <> · {venue._special.start_time}{venue._special.end_time ? `–${venue._special.end_time}` : ''}</>}
      {venue._special.price && <> · {venue._special.price}</>}
    </span>
  )
  if (venue._eventClub) return <span className="font-body text-body-md text-primary-container">Otwarte — sprawdź imprezę na stronie</span>
  if (venue._dayEvents && venue._dayEvents.length > 0) return (
    <span className="block space-y-1">
      {venue._dayEvents.map(e => (
        <span key={e.id} className="block font-body text-body-md text-on-surface">
          <span className="font-semibold">{e.event_name}</span>
          {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
          {e.price && <> · {e.price}</>}
        </span>
      ))}
    </span>
  )
  return <span className="font-body text-body-md text-on-surface-variant/60">Dziś nieczynne</span>
}

// Compact horizontal row — used in the hub club column (narrow). Logo thumb in
// a gold frame + name + status. Big 4/3 cards (VenueRow) are for the city grids.
function VenueRowCompact({ venue, onClick }) {
  const t = getTypeConfig(venue.type)
  return (
    <article onClick={onClick} className="group flex gap-5 py-5 border-b border-outline-variant/15 cursor-pointer">
      <div className="w-20 h-20 flex-shrink-0 border border-primary-container/20 bg-surface-container-low flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary-container/50">
        {venue.logo_url
          ? <img src={venue.logo_url} alt={venue.name} className="max-w-[78%] max-h-[78%] object-contain" />
          : <span className="text-2xl opacity-30">{t.icon}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors truncate">{venue.name}</h4>
          {venue.distance != null && <span className="font-body text-label-caps uppercase text-outline flex-shrink-0">{formatDistance(venue.distance)}</span>}
        </div>
        <div className="font-body text-label-caps uppercase text-primary-container/70 mt-1">{t.label} · {venue.city}</div>
        <div className="mt-2"><VenueStatus venue={venue} /></div>
      </div>
    </article>
  )
}

// Image-tile card (4/3, logo-forward) — used in the city grids.
function VenueRow({ venue, onClick }) {
  const t = getTypeConfig(venue.type)
  return (
    <article onClick={onClick} className="group flex flex-col gap-5 cursor-pointer">
      {/* Logo-forward tile — colour logo, framed centre, gold hairline. Shorter
          than a photo card (4/3) because the asset is a wordmark, not a photo. */}
      <div className="relative aspect-[4/3] overflow-hidden border border-primary-container/20 bg-surface-container-low flex items-center justify-center transition-colors duration-500 group-hover:border-primary-container/50">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.08), transparent 70%)' }} />
        {venue.logo_url ? (
          <img
            src={venue.logo_url}
            alt={venue.name}
            className="relative max-w-[62%] max-h-[58%] object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="relative text-5xl opacity-25">{t.icon}</span>
        )}
        {venue.distance != null && (
          <span className="absolute top-3 right-3 font-body text-label-caps uppercase text-primary-container bg-surface/70 backdrop-blur-sm px-2 py-1">
            {formatDistance(venue.distance)}
          </span>
        )}
      </div>
      {/* Info — left gold rule, district label, Bodoni name, arrow */}
      <div className="flex flex-col gap-3 border-l border-primary-container/25 pl-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <span className="font-body text-label-caps uppercase text-primary-container/70 block mb-1">{t.label} · {venue.city}</span>
            <h4 className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors leading-tight">{venue.name}</h4>
          </div>
          <span className="text-primary-container/40 group-hover:text-primary-container transition-colors text-xl leading-none flex-shrink-0" aria-hidden="true">↗</span>
        </div>
        <VenueStatus venue={venue} />
        <span className="font-body text-label-caps uppercase text-primary-container border-b border-primary-container/20 pb-1 w-fit group-hover:tracking-widest transition-all mt-1">Zobacz lokal</span>
      </div>
    </article>
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
  const [hubScope, setHubScope] = useState(null)   // hub club column: 'nearby' | city name
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

  // ─── Hub club column: city chooser + venues for chosen scope ───
  // Cities sorted by venue count, Polish first. Used by the chooser buttons.
  const chooserCities = [
    ...Object.keys(cityCounts).filter(c => PL_CITY_SET.includes(c)).sort((a, b) => cityCounts[b] - cityCounts[a]),
    ...foreignCities,
  ]
  // Default: GPS nearby if available, else the busiest city.
  const effectiveScope = hubScope || (location ? 'nearby' : chooserCities[0])
  const hubVenues = effectiveScope === 'nearby'
    ? nearby
    : venuesWithDist
        .filter(v => v.city === effectiveScope)
        .map(statusOf).filter(sceneOk).filter(isOpenToday)
        .sort((a, b) => (location && a.distance != null && b.distance != null)
          ? a.distance - b.distance
          : String(a.name).localeCompare(String(b.name), 'pl'))

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
  // Venue deep-link: /miejsca/{id}-slug → own page (shareable, indexable, AI-citable)
  if (cityParam && /^\d+(-|$)/.test(cityParam)) {
    const vid = parseInt(cityParam, 10)
    const v = venuesWithDist.find(x => x.id === vid)
    if (v) return <VenueDetail venue={v} onBack={() => navigate('/miejsca')} />
    if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
    // unknown id → fall through to hub
  }
  if (selectedVenue) {
    const v = venuesWithDist.find(v => v.id === selectedVenue)
    if (v) return <VenueDetail venue={v} onBack={() => window.history.back()} />
  }

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Przewodnik po klubach lifestyle – swing, BDSM, fetysz | ExtraFun</title>
        <meta name="description" content="Mapa i lista klubów lifestyle, swing i BDSM w Polsce. Znajdź miejsce blisko siebie — filtruj po mieście, typie i dniu tygodnia." />
        <link rel="canonical" href="https://extrafun.pl/miejsca" />
      </Helmet>
      {cityParam ? (
        /* ════════ CITY PAGE ════════ */
        <main className="max-w-container-max mx-auto px-6 md:px-16 pt-12 pb-24">
          <button onClick={() => navigate('/miejsca')} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Przewodnik</button>
          <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface mb-2 leading-none">
            {isPolska ? 'Polska' : cityName}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mb-10">
            {loading ? 'Ładowanie…' : `${cityVenues.length} ${cityVenues.length === 1 ? 'lokal' : 'lokali'} · ${dayOffset === 0 ? 'dziś' : dayOffset === 1 ? 'jutro' : 'pojutrze'}`}
          </p>

          <div className="flex gap-3 mb-8">
            {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
              <button key={off} onClick={() => setDayOffset(off)}
                className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${dayOffset === off ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
          ) : cityVenues.length === 0 ? (
            <div className="py-24 text-center font-display italic text-headline-sm text-on-surface">Brak lokali</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              {cityVenues.map(v => <VenueRow key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
            </div>
          )}
        </main>
      ) : (
        /* ════════ HUB ════════ */
        <>
          <Hero
            image="/editorial/hero-przewodnik.jpg"
            label="PRZEWODNIK"
            title="Scena lifestyle — blisko Ciebie"
            lead="Kluby, sauny i miejsca dla par i singli. Filtruj po mieście, typie i dniu."
          />
          <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-16">

              {/* LEFT — club column: city chooser + day tabs + list (narrow) */}
              <div className="md:col-span-7">
                {/* City chooser — compact dropdown (Blisko Mnie + every guide city) */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-body text-label-caps uppercase text-on-surface-variant">Pokaż</span>
                  <div className="relative">
                    <select
                      value={effectiveScope || ''}
                      onChange={(e) => { const v = e.target.value; if (v === 'nearby' && !location) requestLocation(); setHubScope(v) }}
                      style={{ colorScheme: 'dark' }}
                      className="appearance-none bg-transparent border-b border-primary-container/40 focus:border-primary-container outline-none font-display italic text-headline-sm text-on-surface pr-8 py-1 cursor-pointer">
                      <option value="nearby">Blisko Mnie</option>
                      {chooserCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-primary-container">▾</span>
                  </div>
                </div>

                {/* Day tabs */}
                <div className="flex gap-4 mb-8">
                  {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
                    <button key={off} onClick={() => setDayOffset(off)}
                      className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${dayOffset === off ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Club list (or GPS prompt when "Blisko Mnie" chosen without location) */}
                {effectiveScope === 'nearby' && !location ? (
                  <div className="flex items-center gap-4 flex-wrap p-4 border border-outline-variant/30">
                    <span className="flex-1 min-w-[150px] font-body text-body-md text-on-surface-variant">
                      {geoLoading ? 'Szukam lokalizacji…' : geoError ? geoError : 'Pozwól na lokalizację — pokażę najbliższe otwarte.'}
                    </span>
                    {!geoLoading && <Button onClick={requestLocation}>{geoError ? 'Ponów' : 'Włącz GPS'}</Button>}
                  </div>
                ) : loading ? (
                  <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
                ) : hubVenues.length === 0 ? (
                  <div className="py-16 font-display italic text-headline-sm text-on-surface-variant">Dziś nic otwartego — zmień dzień lub miasto.</div>
                ) : (
                  <>
                    {/* Mobile: big logo-forward cards */}
                    <div className="flex flex-col gap-12 md:hidden">
                      {hubVenues.map(v => <VenueRow key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
                    </div>
                    {/* Desktop: compact rows (narrow column) */}
                    <div className="hidden md:flex md:flex-col">
                      {hubVenues.map(v => <VenueRowCompact key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT — editorial: ranking on top, then city guides, then Plaże */}
              <aside className="md:col-span-5 flex flex-col gap-8">
                <ArticleCard article={ARTICLES[0]} hero onClick={() => setSelectedArticle(ARTICLES[0])} />
                {ARTICLES.slice(1).map(a => <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />)}

                <div onClick={() => navigate('/plaze')}
                  className="group flex items-center gap-4 p-6 border border-outline-variant/20 cursor-pointer hover:border-primary-container/40 transition-colors">
                  <span className="text-3xl">🏖️</span>
                  <div className="min-w-0">
                    <div className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">Plaże</div>
                    <div className="font-body text-body-md text-on-surface-variant mt-1">Naturystyczne i FKK w Polsce i Europie</div>
                  </div>
                  <span className="ml-auto text-primary-container text-xl">→</span>
                </div>
              </aside>

            </div>
          </main>
        </>
      )}
    </div>
  )
}
