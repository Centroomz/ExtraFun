import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { getTerm, DICTIONARY_TERMS } from '../lib/dictionary'

const CATEGORY_COLORS = {
  'CNM / Poliamoria':    { bg: 'rgba(233,193,118,0.12)',  color: '#e9c176',  border: 'rgba(233,193,118,0.25)' },
  'Swinging / Lifestyle':{ bg: 'rgba(157,78,222,0.12)', color: '#e9c176',  border: 'rgba(157,78,222,0.25)' },
  'BDSM / Kink':         { bg: 'rgba(157,78,221,0.12)', color: '#e9c176',  border: 'rgba(157,78,221,0.25)' },
  'Ogólne':              { bg: 'rgba(0,255,150,0.12)',  color: '#00FF96',  border: 'rgba(0,255,150,0.25)' },
}

export function SlownikTerm({ slug }) {
  const term = getTerm(slug)

  if (!term) {
    return (
      <div className="page-inner">
        <div style={{ padding: '60px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, color: 'rgba(232,230,252,0.86)' }}>Nie znaleziono terminu</div>
          <Link href="/slownik">
            <div style={{ marginTop: 16, color: '#e9c176', fontSize: 14, cursor: 'pointer' }}>← Wróć do słownika</div>
          </Link>
        </div>
      </div>
    )
  }

  const c = CATEGORY_COLORS[term.category] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(232,230,252,0.86)', border: 'rgba(255,255,255,0.15)' }

  // 3 losowe terminy z tej samej kategorii (nie ten sam)
  const related = DICTIONARY_TERMS
    .filter(t => t.category === term.category && t.slug !== term.slug)
    .slice(0, 3)

  const seoTitle = `${term.term} – co to znaczy? | Słownik ExtraFun`
  const seoDesc = term.definition.slice(0, 155) + (term.definition.length > 155 ? '…' : '')

  return (
    <>
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

      <div className="page-inner">
        <div style={{ padding: '16px 16px 0' }}>
          <Link href="/slownik">
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer' }}>
              ← Słownik
            </span>
          </Link>
        </div>

        <div style={{ padding: '20px 16px 0' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, background: c.bg, color: c.color,
            border: `1px solid ${c.border}`, borderRadius: 8, padding: '3px 10px',
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            {term.category}
          </span>

          <h1 style={{
            fontSize: 28, fontWeight: 900, marginTop: 12, marginBottom: 0,
            background: 'linear-gradient(135deg, #fff 60%, rgba(232,230,252,0.86))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
          }}>{term.term}</h1>
        </div>

        <div style={{ padding: '20px 16px' }}>
          {/* Definicja */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Definicja
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, margin: 0 }}>
              {term.definition}
            </p>
          </div>

          {/* Przykłady */}
          {term.examples?.length > 0 && (
            <div style={{
              background: `linear-gradient(135deg, ${c.bg}, rgba(255,255,255,0.03))`,
              border: `1px solid ${c.border}`,
              borderRadius: 14, padding: '16px 18px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: c.color, marginBottom: 10 }}>
                Przykład
              </div>
              {term.examples.map((ex, i) => (
                <p key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
                  „{ex}"
                </p>
              ))}
            </div>
          )}

          {/* Powiązane terminy */}
          {related.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                Powiązane terminy
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {related.map(r => (
                  <Link key={r.slug} href={`/slownik/${r.slug}`}>
                    <div style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '11px 14px', cursor: 'pointer',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3 }}>{r.term}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                        {r.definition.slice(0, 90)}…
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA do pełnego słownika */}
          <Link href="/slownik">
            <div style={{
              marginTop: 24, padding: '14px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center', cursor: 'pointer', fontSize: 14, color: 'rgba(232,230,252,0.86)',
            }}>
              Zobacz wszystkie {DICTIONARY_TERMS.length} terminów →
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
