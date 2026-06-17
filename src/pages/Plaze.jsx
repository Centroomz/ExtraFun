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
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '16px 18px',
      marginBottom: 12,
    }}>
      {beach.cover_image && (
        <img
          src={beach.cover_image}
          alt={beach.name}
          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          🏖️ {beach.name}
        </h3>
        {gpsUrl && (
          <a
            href={gpsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--cyan)', textDecoration: 'none',
              background: 'rgba(233,193,118,0.1)', borderRadius: 8,
              padding: '4px 8px', whiteSpace: 'nowrap',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            GPS
          </a>
        )}
      </div>

      {beach.city && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          📍 {beach.city}
        </div>
      )}

      {desc && (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          {expanded || !long ? desc : desc.slice(0, 160) + '…'}
          {long && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, padding: '0 0 0 4px' }}
            >
              {expanded ? ' Zwiń' : ' Więcej'}
            </button>
          )}
        </p>
      )}

      {beach.open_info && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {beach.open_info}
        </div>
      )}
    </div>
  )
}

export function Plaze() {
  const [beaches, setBeaches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/venues?type=plaża')
      .then(data => {
        setBeaches(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const grouped = groupByCountry(beaches)

  return (
    <>
      <Helmet>
        <title>Plaże naturystyczne i FKK — Polska i Europa | ExtraFun</title>
        <meta name="description" content="Mapa plaż naturystycznych i FKK w Polsce i Europie. Sprawdź lokalizacje, GPS i opisy plaż nudystycznych w Chorwacji, Grecji, Francji, Włoszech i nie tylko." />
      </Helmet>

      <div className="page-inner">
        <div className="page-header">
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            🏖️ Plaże naturystyczne
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Plaże FKK i nudystyczne w Polsce i Europie
          </p>
        </div>

        <div style={{ padding: '0 16px 100px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Ładowanie…</div>
          ) : grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Brak danych</div>
          ) : (
            grouped.map(({ country, beaches: bs }) => (
              <div key={country} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
                  {country} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({bs.length})</span>
                </h2>
                {bs.map(b => <BeachCard key={b.id} beach={b} />)}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
