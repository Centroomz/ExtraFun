import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { calculateDistance, formatDistance } from '../lib/geo'
import { Hero, Button } from '../components/nocturne'

const COUNTRY_ORDER = [
  'Polska', 'Hiszpania', 'Portugalia', 'Francja', 'Włochy',
  'Chorwacja', 'Czarnogóra', 'Grecja', 'Bułgaria', 'Malta',
]

// Polish cities use district = city-district (Stogi, Dębniki…), so resolve PL by city.
const PL_CITIES = new Set([
  'Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Gdynia', 'Sopot', 'Poznań', 'Łódź',
  'Szczecin', 'Olsztyn', 'Toruń', 'Bydgoszcz', 'Lublin', 'Białystok',
  'Chałupy', 'Tychy', 'Dąbrowa Górnicza', 'Chorzów',
])

// City → country is the reliable signal (every beach has a city). District is fallback.
const CITY_TO_COUNTRY = {
  // Hiszpania
  'Sitges': 'Hiszpania', 'Ibiza': 'Hiszpania', 'Palma de Mallorca': 'Hiszpania',
  'Barcelona': 'Hiszpania', 'Maspalomas': 'Hiszpania', 'Playa del Inglés': 'Hiszpania',
  'Torremolinos': 'Hiszpania',
  // Portugalia
  'Lagos': 'Portugalia', 'Sagres': 'Portugalia', 'Lizbona': 'Portugalia',
  // Francja
  'La Ciotat': 'Francja', 'Pénestin': 'Francja', 'Le Grau-du-Roi': 'Francja',
  "Cap d'Agde": 'Francja', 'Paryż': 'Francja',
  // Włochy
  "Torre dell'Orso": 'Włochy', 'Rzym': 'Włochy', 'Manerba del Garda': 'Włochy',
  'San Vito Lo Capo': 'Włochy', 'Viareggio': 'Włochy',
  // Chorwacja
  'Dubrownik': 'Chorwacja', 'Rovinj': 'Chorwacja', 'Umag': 'Chorwacja', 'Vrsar': 'Chorwacja',
  'Krk': 'Chorwacja', 'Mali Lošinj': 'Chorwacja', 'Rab': 'Chorwacja', 'Primošten': 'Chorwacja',
  'Hvar': 'Chorwacja', 'Makarska': 'Chorwacja', 'Supetar': 'Chorwacja',
  // Czarnogóra
  'Bar': 'Czarnogóra', 'Budva': 'Czarnogóra', 'Sveti Stefan': 'Czarnogóra', 'Ulcinj': 'Czarnogóra',
  // Grecja
  'Ateny': 'Grecja', 'Paros': 'Grecja', 'Elafonissi': 'Grecja', 'Matala': 'Grecja',
  'Faliraki': 'Grecja', 'Skiathos': 'Grecja', 'Mykonos': 'Grecja', 'Lesbos': 'Grecja', 'Korfu': 'Grecja',
  // Bułgaria
  'Krapets': 'Bułgaria', 'Primorsko': 'Bułgaria', 'Słoneczny Brzeg': 'Bułgaria', 'Sozopol': 'Bułgaria',
  // Malta
  'Għajn Tuffieħa': 'Malta',
}

// Region-level district → country (fallback for cities not yet in CITY_TO_COUNTRY).
const DISTRICT_TO_COUNTRY = {
  'Katalonia': 'Hiszpania', 'Wyspy Kanaryjskie': 'Hiszpania', 'Gran Canaria': 'Hiszpania',
  'Baleary': 'Hiszpania', 'Andaluzja': 'Hiszpania', 'Walencja': 'Hiszpania', 'Málaga': 'Hiszpania',
  'Lizbona': 'Portugalia', 'Algarve': 'Portugalia', 'Obszar Lizboński': 'Portugalia',
  'Prowansja': 'Francja', 'Hérault': 'Francja', 'Lazurowe Wybrzeże': 'Francja',
  'Bouches-du-Rhône': 'Francja', 'Bretania': 'Francja', 'Gard': 'Francja', 'Île-de-France': 'Francja',
  'Lacjum': 'Włochy', 'Toskania': 'Włochy', 'Sardynia': 'Włochy', 'Sycylia': 'Włochy',
  'Apulia': 'Włochy', 'Emilia-Romania': 'Włochy', 'Lombardia': 'Włochy',
  'Dalmacja': 'Chorwacja', 'Istria': 'Chorwacja', 'Split-Dalmacja': 'Chorwacja',
  'Šibenik-Knin': 'Chorwacja', 'Kvarner': 'Chorwacja', 'Dubrownik-Neretwa': 'Chorwacja',
  'Czarnogóra': 'Czarnogóra',
  'Attyka': 'Grecja', 'Mykonos': 'Grecja', 'Kreta': 'Grecja', 'Rodos': 'Grecja',
  'Cyklady': 'Grecja', 'Wyspy Jońskie': 'Grecja', 'Lesbos': 'Grecja', 'Tesalia': 'Grecja',
  'Wyspy Egejskie': 'Grecja', 'Wyspy Egejskie Północne': 'Grecja',
  'Bułgaria': 'Bułgaria', 'Malta': 'Malta',
}

function resolveCountry(b) {
  if (b.city && PL_CITIES.has(b.city)) return 'Polska'
  if (b.city && CITY_TO_COUNTRY[b.city]) return CITY_TO_COUNTRY[b.city]
  if (b.district && DISTRICT_TO_COUNTRY[b.district]) return DISTRICT_TO_COUNTRY[b.district]
  const lc = (b.district || '').toLowerCase()
  if (lc.includes('polska') || lc.includes('pomorz') || lc.includes('mazow') || lc.includes('wielk')) return 'Polska'
  if (lc.includes('catalun') || lc.includes('kanary') || lc.includes('balear') || lc.includes('andalu')) return 'Hiszpania'
  if (lc.includes('algarve') || lc.includes('lizbona')) return 'Portugalia'
  if (lc.includes('prowans') || lc.includes('hérault') || lc.includes('lazuro')) return 'Francja'
  if (lc.includes('toskani') || lc.includes('lacjum') || lc.includes('sardyn') || lc.includes('sycyli')) return 'Włochy'
  if (lc.includes('dalmac') || lc.includes('istri') || lc.includes('kvarner')) return 'Chorwacja'
  if (lc.includes('czarno')) return 'Czarnogóra'
  if (lc.includes('attyk') || lc.includes('mykon') || lc.includes('kret') || lc.includes('rodos') || lc.includes('cykla')) return 'Grecja'
  if (lc.includes('bułgar')) return 'Bułgaria'
  return 'Inne'
}

function orderedCountries(countries) {
  const out = []
  for (const c of COUNTRY_ORDER) if (countries.includes(c)) out.push(c)
  for (const c of countries) if (!COUNTRY_ORDER.includes(c) && c !== 'Inne') out.push(c)
  if (countries.includes('Inne')) out.push('Inne') // keep "Inne" last
  return out
}

function groupByCountry(beaches) {
  const grouped = {}
  for (const b of beaches) {
    const country = resolveCountry(b)
    ;(grouped[country] ||= []).push(b)
  }
  return orderedCountries(Object.keys(grouped)).map(country => ({ country, beaches: grouped[country] }))
}

function BeachCard({ beach }) {
  const [expanded, setExpanded] = useState(false)
  const desc = beach.description || ''
  const long = desc.length > 160

  const gpsUrl = beach.lat && beach.lng
    ? `https://www.google.com/maps/search/?api=1&query=${beach.lat},${beach.lng}`
    : null

  return (
    <div className="py-6 border-b border-outline-variant/15">
      {beach.cover_image && (
        <img src={beach.cover_image} alt={beach.name} className="w-full h-44 object-cover mb-4" />
      )}

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="font-display italic font-medium text-headline-sm text-on-surface leading-tight">{beach.name}</h3>
        {gpsUrl && (
          <a href={gpsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1.5 font-body text-label-caps uppercase text-primary-container hover:opacity-80 whitespace-nowrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            GPS
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {beach.city && (
          <span className="font-body text-body-md text-on-surface-variant">{beach.city}</span>
        )}
        {beach.distance != null && (
          <span className="font-body text-label-caps uppercase text-primary-container">· {formatDistance(beach.distance)} od Ciebie</span>
        )}
      </div>

      {desc && (
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
          {expanded || !long ? desc : desc.slice(0, 160) + '…'}
          {long && (
            <button onClick={() => setExpanded(e => !e)} className="text-primary-container ml-1 hover:opacity-80">
              {expanded ? 'Zwiń' : 'Więcej'}
            </button>
          )}
        </p>
      )}

      {beach.open_info && (
        <div className="font-body text-body-md text-on-surface-variant mt-2">{beach.open_info}</div>
      )}
    </div>
  )
}

const chip = (active) =>
  `font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
    active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
  }`

export function Plaze() {
  const [beaches, setBeaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCountry, setActiveCountry] = useState('all')
  const [nearMe, setNearMe] = useState(false)
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => {
    apiFetch('/api/places')
      .then(data => {
        const list = Array.isArray(data) ? data.filter(v => v.type === 'plaża') : []
        setBeaches(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Attach distance when we have a fix.
  const beachesWithDist = location
    ? beaches.map(b => ({
        ...b,
        distance: b.lat && b.lng
          ? calculateDistance(location.lat, location.lng, parseFloat(b.lat), parseFloat(b.lng))
          : null,
      }))
    : beaches

  const handleNearMe = () => {
    const next = !nearMe
    setNearMe(next)
    if (next && !location) requestLocation()
  }

  // Country tabs come from the data, in canonical order.
  const presentCountries = orderedCountries([...new Set(beaches.map(resolveCountry))])

  // "Blisko mnie" → flat distance-sorted list (only beaches with coords). Otherwise grouped by country.
  const nearbyList = beachesWithDist
    .filter(b => b.distance != null)
    .sort((a, b) => a.distance - b.distance)

  const grouped = groupByCountry(
    activeCountry === 'all' ? beachesWithDist : beachesWithDist.filter(b => resolveCountry(b) === activeCountry)
  )

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Plaże naturystyczne i FKK — Polska i Europa | ExtraFun</title>
        <meta name="description" content="Mapa plaż naturystycznych i FKK w Polsce i Europie. Sprawdź lokalizacje, GPS i opisy plaż nudystycznych w Chorwacji, Grecji, Francji, Włoszech i nie tylko." />
      </Helmet>

      <Hero
        image="/editorial/hero-plaze.jpg"
        label="PLAŻE"
        title="Słońce, woda, wolność"
        lead="Plaże naturystyczne i FKK w Polsce i całej Europie — z GPS, opisami i opcją „blisko mnie”."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {/* Filters: po krajach + blisko mnie */}
        <div className="flex flex-wrap gap-x-7 gap-y-3 items-center mb-4">
          <button className={chip(!nearMe && activeCountry === 'all')}
            onClick={() => { setNearMe(false); setActiveCountry('all') }}>
            Wszystkie
          </button>
          {presentCountries.map(c => (
            <button key={c} className={chip(!nearMe && activeCountry === c)}
              onClick={() => { setNearMe(false); setActiveCountry(c) }}>
              {c}
            </button>
          ))}
          <button className={`${chip(nearMe)} ml-auto inline-flex items-center gap-1.5`} onClick={handleNearMe}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Blisko mnie
          </button>
        </div>

        {nearMe && !location && (
          <div className={`flex items-center gap-4 flex-wrap p-4 border mb-8 ${geoError ? 'border-outline-variant/30' : 'border-primary-container/40'}`}>
            <span className="flex-1 min-w-[150px] font-body text-body-md text-on-surface-variant">
              {geoLoading ? 'Szukam lokalizacji…' : geoError ? geoError : 'Włącz lokalizację, aby zobaczyć plaże najbliżej Ciebie.'}
            </span>
            {!geoLoading && <Button onClick={requestLocation}>{geoError ? 'Ponów' : 'Włącz GPS'}</Button>}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : nearMe && location ? (
          nearbyList.length === 0 ? (
            <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Brak plaż z lokalizacją GPS w bazie.</div>
          ) : (
            <div>
              <h2 className="font-body text-label-caps uppercase text-primary-container border-b border-outline-variant/20 pb-3 mb-2 mt-6">
                Blisko Ciebie <span className="text-outline">({nearbyList.length})</span>
              </h2>
              {nearbyList.map(b => <BeachCard key={b.id} beach={b} />)}
            </div>
          )
        ) : grouped.length === 0 ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Brak danych</div>
        ) : (
          <div className="space-y-12 mt-6">
            {grouped.map(({ country, beaches: bs }) => (
              <div key={country}>
                <h2 className="font-body text-label-caps uppercase text-primary-container border-b border-outline-variant/20 pb-3 mb-2">
                  {country} <span className="text-outline">({bs.length})</span>
                </h2>
                {bs.map(b => <BeachCard key={b.id} beach={b} />)}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
