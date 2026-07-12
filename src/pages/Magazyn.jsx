import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { getWordOfTheDay } from '../lib/dictionary'
import { ARTICLES as FALLBACK_ARTICLES, CATEGORIES } from '../lib/articles'
import { QUIZ_QUESTIONS, interpretQuizResult, QUIZ_TITLE } from '../lib/quiz-plazowicz'
import { apiFetch } from '../lib/api'
import { CalendarWidget } from '../components/CalendarWidget'
import { Hero, ArticleCard, SectionHeader, Button } from '../components/nocturne'

const BASE_URL = 'https://extrafun.pl'

function estimateReadingTime(content) {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200))
}

const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'pierwszy-raz':   'Pierwszy Raz',
  'bez-osadu':      'Bez Osądu',
  'tam-i-tam':      'Tam i Tam',
  'slownik':        'Słownik',
  'temat-miesiaca': 'Temat Miesiąca',
  'felieton':       'Felieton',
}

/* ─── Quiz View (inline, no URL needed) ──────────────────────── */
function QuizView({ onBack }) {
  const [current, setCurrent] = useState(0)
  const [scores, setScores] = useState([0, 0, 0, 0])
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)

  const q = QUIZ_QUESTIONS[current]
  const total = QUIZ_QUESTIONS.length

  const handleNext = () => {
    const next = scores.map((s, i) => (i === selected ? s + 1 : s))
    if (current + 1 < total) {
      setScores(next); setCurrent(current + 1); setSelected(null)
    } else {
      try { localStorage.setItem('ef_quiz_plazowicz_done', '1') } catch {}
      setResult(interpretQuizResult(next)); setDone(true)
    }
  }

  const restart = () => {
    setCurrent(0); setScores([0, 0, 0, 0]); setSelected(null); setDone(false); setResult(null)
  }

  return (
    <div className="mag-root">
      <div className="mag-article-bar">
        <button className="mag-back-btn" onClick={onBack}>← Powrót</button>
      </div>
      <div className="quiz-container" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 80px' }}>
        {!done ? (
          <>
            <div className="quiz-progress">
              <div className="quiz-progress-fill" style={{ width: `${(current / total) * 100}%` }} />
            </div>
            <div className="quiz-question-num">Pytanie {current + 1} z {total}</div>
            <div className="quiz-question">{q.question}</div>
            <div className="quiz-answers">
              {q.options.map((opt, i) => (
                <button key={i} className={`quiz-answer ${selected === i ? 'selected' : ''}`}
                  onClick={() => setSelected(i)}>{opt}</button>
              ))}
            </div>
            {selected !== null && (
              <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handleNext}>
                {current + 1 < total ? 'Następne →' : 'Zobacz wynik →'}
              </button>
            )}
          </>
        ) : (
          <div className="quiz-result">
            <span className="quiz-result-emoji">{result.emoji}</span>
            <h2 className="quiz-result-title" style={{ color: result.color }}>{result.title}</h2>
            <p className="quiz-result-desc">{result.description}</p>
            <p className="quiz-result-desc" style={{ opacity: 0.85, fontStyle: 'italic', marginTop: 12 }}>
              💡 {result.advice}
            </p>
            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={onBack}>Wróć do Magazynu</button>
            <button className="mag-back-btn" style={{ width: '100%', marginTop: 12 }} onClick={restart}>↺ Jeszcze raz</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Magazyn Main ────────────────────────────────────────────── */
export function Magazyn() {
  const [, navigate] = useLocation()
  const [activeCategory, setActiveCategory] = useState('Wszystkie')
  const [showQuiz, setShowQuiz] = useState(false)
  const [dbArticles, setDbArticles] = useState(null)
  const [quizDone, setQuizDone] = useState(() => {
    try { return localStorage.getItem('ef_quiz_plazowicz_done') === '1' } catch { return false }
  })

  useEffect(() => {
    apiFetch('/api/articles')
      .then(data => {
        if (!data || data.length === 0) {
          setDbArticles([])
        } else {
          setDbArticles(data.map(a => ({
            id: a.id,
            slug: a.slug || `artykul-${a.id}`,
            title: a.title,
            description: a.excerpt || '',
            category: SLUG_TO_DISPLAY[a.category_slug] || a.category_slug || 'CNM 101',
            reading_time: estimateReadingTime(a.content),
            cover_image: a.cover_image || null,
            featured: a.featured || false,
          })))
        }
      })
      .catch(() => setDbArticles([]))
  }, [])

  const allArticles = (dbArticles && dbArticles.length > 0) ? dbArticles : FALLBACK_ARTICLES
  const word = getWordOfTheDay()

  const filtered = activeCategory === 'Wszystkie'
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory)

  // Featured first, then the rest — shown in the grid (hero is a stable brand
  // banner, so it never swaps/flashes when DB articles load in).
  const ordered = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  if (showQuiz) return <QuizView onBack={() => {
    setShowQuiz(false)
    try { setQuizDone(localStorage.getItem('ef_quiz_plazowicz_done') === '1') } catch {}
  }} />

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Magazyn – CNM, Poliamoria, Swing, Fetysz | ExtraFun</title>
        <meta name="description" content="ExtraFun – magazyn o konsensulanej niemonogamii, poliamorii, swingu, fetyszu i BDSM. Artykuły, przewodniki i społeczność dla dorosłych w Polsce." />
        <link rel="canonical" href={`${BASE_URL}/magazyn`} />
        <meta property="og:title" content="ExtraFun – Magazyn CNM & Lifestyle" />
        <meta property="og:description" content="Artykuły o poliamorii, CNM, swingu, fetyszu i związkach otwartych. Polska społeczność dla dorosłych." />
        <meta property="og:url" content={`${BASE_URL}/magazyn`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${BASE_URL}/og-default.jpg`} />
        <meta property="og:site_name" content="ExtraFun" />
      </Helmet>

      {/* Monthly theme hero — nadtytuł = temat miesiąca (edytować co miesiąc).
          Stały, nie swapuje się przy ładowaniu danych (bez flashu/covera). */}
      <Hero
        image="/editorial/hero-lipiec-plener.jpg"
        label="LIPIEC · PLENER"
        title="Plener. Plaże, nagość, natura."
        lead="Numer lipcowy: plaże FKK, naturyzm, seks w plenerze i cienka granica między nagością a wstydem — teksty o życiu bez ubrań i bez miasta."
      />

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">
        {/* Quiz miesiąca — prominentny CTA na górze. Po rozwiązaniu znika stąd
            i zostaje już tylko w bocznym pasku na dole. */}
        {!quizDone && (
          <button
            onClick={() => setShowQuiz(true)}
            className="group w-full text-left mb-16 p-6 md:p-8 border border-primary-container/40 hover:border-primary-container transition-colors flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.03))' }}
          >
            <div className="text-5xl md:text-6xl shrink-0">🏖️</div>
            <div className="flex-1">
              <div className="font-body text-label-caps uppercase text-primary-container mb-2">Quiz miesiąca · Lipiec</div>
              <div className="font-display text-headline-sm md:text-headline-md text-on-surface mb-1">{QUIZ_TITLE}</div>
              <p className="font-body text-body-md text-on-surface-variant">Sezon na plaże bez tabu — 12 pytań, 4 typy. Sprawdź, kim jesteś na piasku.</p>
            </div>
            <span className="font-body text-label-caps uppercase text-primary-container shrink-0 group-hover:translate-x-1 transition-transform">Zacznij →</span>
          </button>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-x-7 gap-y-3 mb-16">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article grid — left-aligned 12-col, asymmetric */}
        {ordered.length > 0 ? (
          <section>
            <SectionHeader title={activeCategory === 'Wszystkie' ? 'Wszystkie artykuły' : activeCategory} />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-16">
              {ordered.map((article, idx) => {
                const big = idx % 3 === 0
                return (
                  <div key={article.id} className={big ? 'md:col-span-8' : 'md:col-span-4'}>
                    <ArticleCard
                      image={article.cover_image || undefined}
                      tag={article.category}
                      title={article.title}
                      lead={article.description}
                      meta={`${article.reading_time} min czytania`}
                      variant={big ? 'large' : 'small'}
                      onClick={() => navigate(`/magazyn/${article.slug}`)}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="py-24 text-center">
            <div className="font-display text-headline-sm text-on-surface mb-2">Brak artykułów</div>
            <div className="font-body text-body-md text-on-surface-variant">W tej kategorii nie ma jeszcze żadnych artykułów.</div>
          </div>
        )}

        {/* Secondary rail — słówko dnia · quiz · kalendarz */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 border border-outline-variant/20 p-6">
            <div className="font-body text-label-caps uppercase text-primary-container mb-3">Słówko dnia</div>
            <div className="font-display text-headline-sm text-on-surface mb-2">{word.term}</div>
            <p className="font-body text-body-md text-on-surface-variant">{word.definition}</p>
            <Link href="/slownik" className="inline-block mt-4 font-body text-label-caps uppercase text-primary-container hover:opacity-80">Cały słownik →</Link>
          </div>

          <div className="md:col-span-4 border border-outline-variant/20 p-6">
            <div className="font-body text-label-caps uppercase text-primary-container mb-3">Quiz miesiąca · Lipiec</div>
            <div className="font-display text-headline-sm text-on-surface mb-2">{QUIZ_TITLE}</div>
            <p className="font-body text-body-md text-on-surface-variant mb-5">Sezon na plaże bez tabu — 12 pytań, 4 typy.</p>
            <Button onClick={() => setShowQuiz(true)}>Zacznij</Button>
          </div>

          <div className="md:col-span-4">
            <CalendarWidget />
          </div>
        </section>
      </main>
    </div>
  )
}
