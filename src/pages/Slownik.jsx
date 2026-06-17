import { useState } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { DICTIONARY_TERMS, getTermsByCategory } from '../lib/dictionary'

const CATEGORY_COLORS = {
  'CNM / Poliamoria':   { bg: 'rgba(233,193,118,0.12)',  color: '#e9c176',  border: 'rgba(233,193,118,0.25)' },
  'Swinging / Lifestyle':{ bg: 'rgba(157,78,222,0.12)', color: '#9D4EDE',  border: 'rgba(157,78,222,0.25)' },
  'BDSM / Kink':        { bg: 'rgba(157,78,221,0.12)', color: '#9D4EDE',  border: 'rgba(157,78,221,0.25)' },
  'Ogólne':             { bg: 'rgba(0,255,150,0.12)',  color: '#00FF96',  border: 'rgba(0,255,150,0.25)' },
}

export function Slownik() {
  const [q, setQ] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortAlpha, setSortAlpha] = useState(false)
  const byCategory = getTermsByCategory()
  const categories = Object.keys(byCategory)

  const filtered = DICTIONARY_TERMS.filter(t => {
    const matchQ = !q || t.term.toLowerCase().includes(q.toLowerCase()) || t.definition.toLowerCase().includes(q.toLowerCase())
    const matchCat = activeCategory === 'all' || t.category === activeCategory
    return matchQ && matchCat
  })

  const sortedFiltered = sortAlpha
    ? [...filtered].sort((a, b) => a.term.localeCompare(b.term, 'pl'))
    : filtered

  const grouped = {}
  for (const t of sortedFiltered) (grouped[sortAlpha ? t.term[0].toUpperCase() : t.category] ||= []).push(t)

  return (
    <>
      <Helmet>
        <title>Słownik CNM, Swinging i BDSM – ExtraFun</title>
        <meta name="description" content={`Słownik ${DICTIONARY_TERMS.length} terminów ze świata CNM, poliamorii, swingingu i BDSM. Polskie definicje, przykłady, bez tabu.`} />
        <link rel="canonical" href="https://extrafun.pl/slownik" />
      </Helmet>

      <div className="page-inner">
        <div className="page-header">
          <h1>Słownik</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>
            {DICTIONARY_TERMS.length} terminów — CNM, poliamoria, swinging, BDSM
          </p>
        </div>

        {/* Szukaj */}
        <div style={{ padding: '0 16px 12px' }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Szukaj terminu…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Filtry kategorii + sort */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setActiveCategory('all')} style={{
            fontSize: 12, padding: '6px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: activeCategory === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
            color: activeCategory === 'all' ? '#fff' : 'rgba(255,255,255,0.5)',
          }}>Wszystkie ({DICTIONARY_TERMS.length})</button>
          {categories.map(cat => {
            const c = CATEGORY_COLORS[cat] || { bg: 'rgba(255,255,255,0.08)', color: '#fff', border: 'transparent' }
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                fontSize: 12, padding: '6px 13px', borderRadius: 20, border: `1px solid ${activeCategory === cat ? c.border : 'transparent'}`,
                cursor: 'pointer', fontWeight: 600,
                background: activeCategory === cat ? c.bg : 'rgba(255,255,255,0.06)',
                color: activeCategory === cat ? c.color : 'rgba(255,255,255,0.5)',
              }}>{cat} ({byCategory[cat].length})</button>
            )
          })}
          {/* Sort toggle */}
          <button onClick={() => setSortAlpha(v => !v)} style={{
            fontSize: 12, padding: '6px 13px', borderRadius: 20, border: `1px solid ${sortAlpha ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
            cursor: 'pointer', fontWeight: 600, marginLeft: 'auto',
            background: sortAlpha ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            color: sortAlpha ? '#fff' : 'rgba(255,255,255,0.4)',
          }}>A–Z</button>
        </div>

        {/* Cross-link: gay.pl */}
        <a href="https://gay.pl/slownik" target="_blank" rel="noopener noreferrer" style={{
          display: 'block', margin: '0 16px 16px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '14px 16px', textDecoration: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Też cię interesuje?</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Słownik LGBT+ →</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>gay.pl/slownik — orientacje, tożsamości, subkultury</div>
        </a>

        {/* Lista terminów */}
        <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sortedFiltered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Brak wyników dla "{q}"
            </div>
          ) : q ? (
            // Wyniki wyszukiwania — flat list
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedFiltered.map(t => <TermRow key={t.slug} term={t} />)}
            </div>
          ) : (
            // Pogrupowane po kategoriach lub literach
            Object.entries(grouped).map(([group, terms]) => (
              <div key={group}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: sortAlpha ? 'rgba(255,255,255,0.4)' : (CATEGORY_COLORS[group]?.color || 'rgba(255,255,255,0.4)'),
                  marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${sortAlpha ? 'rgba(255,255,255,0.08)' : (CATEGORY_COLORS[group]?.border || 'rgba(255,255,255,0.08)')}`,
                }}>{group}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {terms.map(t => <TermRow key={t.slug} term={t} />)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function TermRow({ term }) {
  const c = CATEGORY_COLORS[term.category] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'transparent' }
  return (
    <Link href={`/slownik/${term.slug}`}>
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontFamily: 'Playfair Display', fontWeight: 600, fontSize: 17, color: '#fff' }}>{term.term}</div>
          <span style={{ fontSize: 10, background: c.bg, color: c.color, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {term.category}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
          {term.definition.slice(0, 120)}{term.definition.length > 120 ? '…' : ''}
        </div>
      </div>
    </Link>
  )
}
