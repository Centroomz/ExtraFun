import { useState } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { DICTIONARY_TERMS, getTermsByCategory } from '../lib/dictionary'
import { Hero } from '../components/nocturne'

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

  const isAlpha = sortAlpha && !q
  const sortedFiltered = isAlpha
    ? [...filtered].sort((a, b) => a.term.localeCompare(b.term, 'pl'))
    : filtered

  const grouped = {}
  for (const t of sortedFiltered) (grouped[isAlpha ? t.term[0].toUpperCase() : t.category] ||= []).push(t)

  // Letters that actually have a term — the A–Z jump index.
  const presentLetters = Array.from(new Set(DICTIONARY_TERMS.map(t => t.term[0].toUpperCase())))
    .sort((a, b) => a.localeCompare(b, 'pl'))

  // Jump to a letter: switch to alphabetical mode, clear filters, scroll to it.
  const jumpToLetter = (L) => {
    setQ(''); setActiveCategory('all'); setSortAlpha(true)
    setTimeout(() => document.getElementById('letter-' + L)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  const chip = (active) =>
    `font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
      active ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
    }`

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Słownik CNM, Swinging i BDSM – ExtraFun</title>
        <meta name="description" content={`Słownik ${DICTIONARY_TERMS.length} terminów ze świata CNM, poliamorii, swingingu i BDSM. Polskie definicje, przykłady, bez tabu.`} />
        <link rel="canonical" href="https://extrafun.pl/slownik" />
      </Helmet>

      <Hero
        image="/editorial/hero-slownik.jpg"
        label="LEKSYKON WSPÓŁCZESNEJ INTYMNOŚCI"
        title="Słownik Pojęć"
        lead={`Encyklopedia niemonogamii, świadomej zgody i ewoluującej architektury bliskości. ${DICTIONARY_TERMS.length} haseł — CNM, poliamoria, swinging, BDSM.`}
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {/* Szukaj */}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Szukaj terminu…"
          className="w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50 mb-6"
        />

        {/* Filtry kategorii + sort */}
        <div className="flex gap-3 flex-wrap items-center mb-6">
          <button onClick={() => setActiveCategory('all')} className={chip(activeCategory === 'all')}>
            Wszystkie ({DICTIONARY_TERMS.length})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={chip(activeCategory === cat)}>
              {cat} ({byCategory[cat].length})
            </button>
          ))}
          <button onClick={() => setSortAlpha(v => !v)} className={`${chip(isAlpha)} ml-auto`}>A–Z</button>
        </div>

        {/* A–Z index */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-y border-outline-variant/15 py-4 mb-10">
          {presentLetters.map(L => (
            <button key={L} onClick={() => jumpToLetter(L)}
              className="font-display text-headline-sm text-on-surface-variant hover:text-primary-container transition-colors leading-none">
              {L}
            </button>
          ))}
        </div>

        {/* Cross-link: gay.pl */}
        <a
          href="https://gay.pl/slownik"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 mb-12 p-4 border border-outline-variant/20 hover:border-primary-container/40 transition-colors no-underline"
        >
          <div className="min-w-0">
            <div className="font-body text-label-caps uppercase text-outline mb-1">Też cię interesuje?</div>
            <div className="font-display italic font-medium text-headline-sm text-on-surface">Słownik LGBT+ — orientacje, tożsamości, subkultury</div>
          </div>
          <span className="ml-auto text-primary-container text-xl">→</span>
        </a>

        {/* Lista terminów */}
        {sortedFiltered.length === 0 ? (
          <div className="py-16 text-center font-body text-body-md text-on-surface-variant">Brak wyników dla „{q}"</div>
        ) : q ? (
          <div className="flex flex-col">
            {sortedFiltered.map(t => <TermRow key={t.slug} term={t} />)}
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(grouped).map(([group, terms]) => (
              <section key={group} id={isAlpha ? 'letter-' + group : undefined} className="scroll-mt-24">
                {isAlpha ? (
                  <h2 className="font-display text-display-lg-mobile md:text-display-lg text-primary-container/30 leading-none mb-4 border-b border-outline-variant/15 pb-2">{group}</h2>
                ) : (
                  <h2 className="font-display italic font-medium text-headline-sm text-on-surface border-b border-outline-variant/20 pb-3 mb-4">{group}</h2>
                )}
                <div className="flex flex-col">
                  {terms.map(t => <TermRow key={t.slug} term={t} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Zaproponuj hasło */}
        <section className="mt-20 p-8 md:p-12 border border-outline-variant/15 bg-surface-container text-center">
          <h3 className="font-display italic font-medium text-headline-md text-on-surface mb-3">Nie znalazłeś hasła?</h3>
          <p className="font-body text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Stale rozbudowujemy leksykon. Jeśli brakuje Ci konkretnego pojęcia — daj znać, dopiszemy.
          </p>
          <a
            href="mailto:pinksservice@gmail.com?subject=Propozycja%20hasła%20do%20słownika%20ExtraFun"
            className="inline-block bg-primary-container text-on-primary font-body text-label-caps uppercase px-8 py-4 hover:bg-primary transition-colors no-underline active:scale-95"
          >
            Zaproponuj hasło
          </a>
        </section>
      </main>
    </div>
  )
}

function TermRow({ term }) {
  return (
    <Link href={`/slownik/${term.slug}`}>
      <article className="group py-6 border-b border-outline-variant/15 cursor-pointer">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h3 className="font-display italic font-medium text-headline-sm md:text-headline-md text-on-surface group-hover:text-primary-container transition-colors leading-tight">
            {term.term}
          </h3>
          <span className="font-body text-label-caps uppercase text-primary-container/60 flex-shrink-0 hidden sm:block">{term.category}</span>
        </div>
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
          {term.definition.slice(0, 180)}{term.definition.length > 180 ? '…' : ''}
        </p>
        <span className="inline-flex items-center gap-1 mt-3 font-body text-label-caps uppercase text-primary-container group-hover:tracking-widest transition-all">
          Czytaj dalej <span aria-hidden="true">↗</span>
        </span>
      </article>
    </Link>
  )
}
