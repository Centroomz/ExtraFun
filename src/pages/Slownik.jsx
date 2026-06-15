import { useState } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { DICTIONARY_TERMS, getTermsByCategory } from '../lib/dictionary'

const CATEGORY_COLORS = {
  'CNM / Poliamoria':   { bg: 'rgba(0,229,255,0.12)',  color: '#00E5FF',  border: 'rgba(0,229,255,0.25)' },
  'Swinging / Lifestyle':{ bg: 'rgba(255,0,128,0.12)', color: '#FF0080',  border: 'rgba(255,0,128,0.25)' },
  'BDSM / Kink':        { bg: 'rgba(157,78,221,0.12)', color: '#9D4EDD',  border: 'rgba(157,78,221,0.25)' },
  'Ogólne':             { bg: 'rgba(0,255,150,0.12)',  color: '#00FF96',  border: 'rgba(0,255,150,0.25)' },
}

export function Slownik() {
  const [q, setQ] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const byCategory = getTermsByCategory()
  const categories = Object.keys(byCategory)

  const filtered = DICTIONARY_TERMS.filter(t => {
    const matchQ = !q || t.term.toLowerCase().includes(q.toLowerCase()) || t.definition.toLowerCase().includes(q.toLowerCase())
    const matchCat = activeCategory === 'all' || t.category === activeCategory
    return matchQ && matchCat
  })

  const grouped = {}
  for (const t of filtered) (grouped[t.category] ||= []).push(t)

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

        {/* Filtry kategorii */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', flexWrap: 'wrap' }}>
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
        </div>

        {/* Lista terminów */}
        <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Brak wyników dla "{q}"
            </div>
          ) : q ? (
            // Wyniki wyszukiwania — flat list
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(t => <TermRow key={t.slug} term={t} />)}
            </div>
          ) : (
            // Pogrupowane po kategoriach
            Object.entries(grouped).map(([cat, terms]) => (
              <div key={cat}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: CATEGORY_COLORS[cat]?.color || 'rgba(255,255,255,0.4)',
                  marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${CATEGORY_COLORS[cat]?.border || 'rgba(255,255,255,0.08)'}`,
                }}>{cat}</div>
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
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{term.term}</div>
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
