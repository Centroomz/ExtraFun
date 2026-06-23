import { useState } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { DICTIONARY_TERMS, getTermsByCategory } from '../lib/dictionary'

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

  const chip = (active) =>
    `font-body text-label-caps uppercase px-4 py-2 border transition-colors ${
      active ? 'border-primary-container text-primary-container' : 'border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
    }`

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Słownik CNM, Swinging i BDSM – ExtraFun</title>
        <meta name="description" content={`Słownik ${DICTIONARY_TERMS.length} terminów ze świata CNM, poliamorii, swingingu i BDSM. Polskie definicje, przykłady, bez tabu.`} />
        <link rel="canonical" href="https://extrafun.pl/slownik" />
      </Helmet>

      <main className="max-w-container-max mx-auto px-6 md:px-16 pt-12 pb-24">
        <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface mb-2 leading-none">Słownik</h1>
        <p className="font-body text-body-md text-on-surface-variant mb-10">
          {DICTIONARY_TERMS.length} terminów — CNM, poliamoria, swinging, BDSM
        </p>

        {/* Szukaj */}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Szukaj terminu…"
          className="w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50 mb-6"
        />

        {/* Filtry kategorii + sort */}
        <div className="flex gap-3 flex-wrap items-center mb-10">
          <button onClick={() => setActiveCategory('all')} className={chip(activeCategory === 'all')}>
            Wszystkie ({DICTIONARY_TERMS.length})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={chip(activeCategory === cat)}>
              {cat} ({byCategory[cat].length})
            </button>
          ))}
          <button onClick={() => setSortAlpha(v => !v)} className={`${chip(sortAlpha)} ml-auto`}>A–Z</button>
        </div>

        {/* Cross-link: gay.pl */}
        <a
          href="https://gay.pl/slownik"
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-12 p-5 border border-outline-variant/20 hover:border-primary-container/40 transition-colors no-underline"
        >
          <div className="font-body text-label-caps uppercase text-outline mb-1">Też cię interesuje?</div>
          <div className="font-display italic font-medium text-headline-sm text-on-surface">Słownik LGBT+ →</div>
          <div className="font-body text-body-md text-on-surface-variant mt-1">gay.pl/slownik — orientacje, tożsamości, subkultury</div>
        </a>

        {/* Lista terminów */}
        {sortedFiltered.length === 0 ? (
          <div className="py-16 text-center font-body text-body-md text-on-surface-variant">Brak wyników dla „{q}"</div>
        ) : q ? (
          <div className="flex flex-col">
            {sortedFiltered.map(t => <TermRow key={t.slug} term={t} />)}
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([group, terms]) => (
              <div key={group}>
                <h2 className="font-display italic font-medium text-headline-sm text-on-surface border-b border-outline-variant/20 pb-3 mb-4">{group}</h2>
                <div className="flex flex-col">
                  {terms.map(t => <TermRow key={t.slug} term={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TermRow({ term }) {
  return (
    <Link href={`/slownik/${term.slug}`}>
      <div className="group flex justify-between items-start gap-4 py-4 border-b border-outline-variant/15 cursor-pointer">
        <div className="min-w-0">
          <div className="font-display italic font-medium text-body-lg text-on-surface group-hover:text-primary-container transition-colors">{term.term}</div>
          <div className="font-body text-body-md text-on-surface-variant mt-1 leading-relaxed">
            {term.definition.slice(0, 120)}{term.definition.length > 120 ? '…' : ''}
          </div>
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container flex-shrink-0 whitespace-nowrap">{term.category}</span>
      </div>
    </Link>
  )
}
