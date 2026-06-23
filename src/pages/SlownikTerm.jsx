import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { getTerm, DICTIONARY_TERMS } from '../lib/dictionary'

export function SlownikTerm({ slug }) {
  const term = getTerm(slug)

  if (!term) {
    return (
      <div className="bg-background min-h-screen text-on-surface">
        <main className="max-w-2xl mx-auto px-6 md:px-16 py-24 text-center">
          <div className="font-display italic text-headline-md text-on-surface mb-4">Nie znaleziono terminu</div>
          <Link href="/slownik">
            <span className="font-body text-label-caps uppercase text-primary-container cursor-pointer">← Wróć do słownika</span>
          </Link>
        </main>
      </div>
    )
  }

  // 3 terminy z tej samej kategorii (nie ten sam)
  const related = DICTIONARY_TERMS
    .filter(t => t.category === term.category && t.slug !== term.slug)
    .slice(0, 3)

  const seoTitle = `${term.term} – co to znaczy? | Słownik ExtraFun`
  const seoDesc = term.definition.slice(0, 155) + (term.definition.length > 155 ? '…' : '')

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://extrafun.pl/slownik/${term.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          name: term.term,
          description: term.definition,
          inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: 'Słownik ExtraFun',
            url: 'https://extrafun.pl/slownik',
          },
        })}</script>
      </Helmet>

      <main className="max-w-2xl mx-auto px-6 md:px-16 pt-12 pb-24">
        <Link href="/slownik">
          <span className="font-body text-label-caps uppercase text-primary-container cursor-pointer hover:opacity-80">← Słownik</span>
        </Link>

        <div className="mt-6 mb-10">
          <span className="font-body text-label-caps uppercase text-primary-container">{term.category}</span>
          <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface leading-none mt-3">{term.term}</h1>
        </div>

        {/* Definicja */}
        <div className="mb-8">
          <div className="font-body text-label-caps uppercase text-outline mb-3">Definicja</div>
          <p className="font-body text-body-lg text-on-surface leading-relaxed">{term.definition}</p>
        </div>

        {/* Przykłady */}
        {term.examples?.length > 0 && (
          <div className="mb-8 border-l-2 border-primary-container/50 pl-5">
            <div className="font-body text-label-caps uppercase text-primary-container mb-3">Przykład</div>
            {term.examples.map((ex, i) => (
              <p key={i} className="font-body text-body-md text-on-surface-variant leading-relaxed">„{ex}"</p>
            ))}
          </div>
        )}

        {/* Powiązane terminy */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="font-body text-label-caps uppercase text-outline mb-4">Powiązane terminy</div>
            <div className="flex flex-col">
              {related.map(r => (
                <Link key={r.slug} href={`/slownik/${r.slug}`}>
                  <div className="group py-4 border-b border-outline-variant/15 cursor-pointer">
                    <div className="font-display italic font-medium text-body-lg text-on-surface group-hover:text-primary-container transition-colors">{r.term}</div>
                    <div className="font-body text-body-md text-on-surface-variant mt-1 leading-relaxed">{r.definition.slice(0, 90)}…</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA do pełnego słownika */}
        <Link href="/slownik">
          <div className="mt-12 p-4 border border-outline-variant/20 text-center font-body text-label-caps uppercase text-primary-container cursor-pointer hover:border-primary-container/40 transition-colors">
            Zobacz wszystkie {DICTIONARY_TERMS.length} terminów →
          </div>
        </Link>
      </main>
    </div>
  )
}
