import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'

const COUNTRY_ORDER = [
  'Polska', 'Hiszpania', 'Portugalia', 'Francja', 'Włochy',
  'Chorwacja', 'Czarnogóra', 'Grecja', 'Bułgaria',
]

const DISTRICT_TO_COUNTRY = {
  'Polska': 'Polska',
  'Trójmiasto': 'Polska', 'Gdańsk': 'Polska', 'Mazowsze': 'Polska', 'Małopolska': 'Polska',
  'Katalonia': 'Hiszpania', 'Wyspy Kanaryjskie': 'Hiszpania', 'Baleary': 'Hiszpania',
  'Andaluzja': 'Hiszpania', 'Walencja': 'Hiszpania',
  'Lizbona': 'Portugalia', 'Algarve': 'Portugalia',
  'Prowansja': 'Francja', 'Hérault': 'Francja', 'Lazurowe Wybrzeże': 'Francja',
  'Lacjum': 'Włochy', 'Toskania': 'Włochy', 'Sardynia': 'Włochy', 'Sycylia': 'Włochy',
  'Apulia': 'Włochy', 'Emilia-Romania': 'Włochy',
  'Dalmacja': 'Chorwacja', 'Istria': 'Chorwacja', 'Split-Dalmacja': 'Chorwacja',
  'Šibenik-Knin': 'Chorwacja',
  'Czarnogóra': 'Czarnogóra',
  'Attyka': 'Grecja', 'Mykonos': 'Grecja', 'Kreta': 'Grecja', 'Rodos': 'Grecja',
  'Cyklady': 'Grecja', 'Wyspy Jońskie': 'Grecja', 'Lesbos': 'Grecja',
  'Bułgaria': 'Bułgaria',
}

function districtToCountry(district, city) {
  if (!district) return 'Inne'
  if (DISTRICT_TO_COUNTRY[district]) return DISTRICT_TO_COUNTRY[district]
  const lc = district.toLowerCase()
  if (lc.includes('polska') || lc.includes('pomorz') || lc.includes('mazow') || lc.includes('wielk')) return 'Polska'
  if (lc.includes('catalun') || lc.includes('kanary') || lc.includes('balear') || lc.includes('andalu')) return 'Hiszpania'
  if (lc.includes('algarve') || lc.includes('lizbona')) return 'Portugalia'
  if (lc.includes('prowans') || lc.includes('hérault') || lc.includes('lazuro')) return 'Francja'
  if (lc.includes('toskani') || lc.includes('lacjum') || lc.includes('sardyn') || lc.includes('sycyli')) return 'Włochy'
  if (lc.includes('dalmac') || lc.includes('istri')) return 'Chorwacja'
  if (lc.includes('czarno')) return 'Czarnogóra'
  if (lc.includes('attyk') || lc.includes('mykon') || lc.includes('kret') || lc.includes('rodos') || lc.includes('cykla')) return 'Grecja'
  if (lc.includes('bułgar')) return 'Bułgaria'
  return 'Inne'
}

function groupByCountry(beaches) {
  const grouped = {}
  for (const b of beaches) {
    const country = districtToCountry(b.district, b.city)
    if (!grouped[country]) grouped[country] = []
    grouped[country].push(b)
  }
  const result = []
  for (const c of COUNTRY_ORDER) {
    if (grouped[c]?.length) result.push({ country: c, beaches: grouped[c] })
  }
  for (const [c, bs] of Object.entries(grouped)) {
    if (!COUNTRY_ORDER.includes(c)) result.push({ country: c, beaches: bs })
  }
  return result
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

      {beach.city && (
        <div className="font-body text-body-md text-on-surface-variant mb-2">{beach.city}</div>
      )}

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

export function Plaze() {
  const [beaches, setBeaches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/places')
      .then(data => {
        const list = Array.isArray(data) ? data.filter(v => v.type === 'plaża') : []
        setBeaches(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const grouped = groupByCountry(beaches)

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Plaże naturystyczne i FKK — Polska i Europa | ExtraFun</title>
        <meta name="description" content="Mapa plaż naturystycznych i FKK w Polsce i Europie. Sprawdź lokalizacje, GPS i opisy plaż nudystycznych w Chorwacji, Grecji, Francji, Włoszech i nie tylko." />
      </Helmet>

      <main className="max-w-container-max mx-auto px-6 md:px-16 pt-12 pb-24">
        <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface mb-2 leading-none">Plaże naturystyczne</h1>
        <p className="font-body text-body-md text-on-surface-variant mb-10">Plaże FKK i nudystyczne w Polsce i Europie</p>

        {loading ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
        ) : grouped.length === 0 ? (
          <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Brak danych</div>
        ) : (
          <div className="space-y-12">
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
