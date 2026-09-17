import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { ARTICLES as FALLBACK_ARTICLES } from '../lib/articles'
import { QUIZ_QUESTIONS, interpretQuizResult, QUIZ_TITLE } from '../lib/quiz-dogging'
import { apiFetch } from '../lib/api'
import { CalendarWidget } from '../components/CalendarWidget'
import { SiteRail } from '../components/SiteRail'
import { RubrykaSection } from '../components/RubrykaSection'
import { MagCard, MagSectionHeader } from '../components/MagCard'
import { MagazynMobileFeed, firstParagraph } from '../components/MagazynMobileFeed'
import { Hero } from '../components/nocturne'
import { getMonthTheme } from '../lib/theme-month'
import { SLUG_TO_DISPLAY } from '../lib/rubryki'

const BASE_URL = 'https://www.extrafun.pl'

function estimateReadingTime(content) {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200))
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
      try { localStorage.setItem('ef_quiz_dogging_done', '1') } catch {}
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
    try { return localStorage.getItem('ef_quiz_dogging_done') === '1' } catch { return false }
  })

  // SiteRail on other pages links here with ?quiz=1 → open the quiz right away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('quiz') === '1') {
      setShowQuiz(true)
      window.history.replaceState(null, '', '/magazyn')
    }
  }, [])

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
            category_slug: a.category_slug || null,
            category: SLUG_TO_DISPLAY[a.category_slug] || a.category_slug || 'CNM 101',
            reading_time: estimateReadingTime(a.content),
            cover_image: a.cover_image || null,
            featured: a.featured || false,
            publish_date: a.publish_date || a.created_at || null,
            views: a.views || 0,
            firstParagraph: firstParagraph(a.content),
          })))
        }
      })
      .catch(() => setDbArticles([]))
  }, [])

  const allArticles = (dbArticles && dbArticles.length > 0) ? dbArticles : FALLBACK_ARTICLES

  const byDate = (list) => [...list].sort((a, b) => new Date(b.publish_date || 0) - new Date(a.publish_date || 0))
  const bySlugs = (slugs) => byDate(allArticles.filter(a => slugs.includes(a.category_slug)))

  const theme = getMonthTheme()
  const themeSlugs = theme?.slugs || []
  const themeName = SLUG_TO_DISPLAY[themeSlugs[0]] || ''

  // Backbone rubrics (newest first). Empty ones render nothing (RubrykaSection).
  const secTemat  = bySlugs(themeSlugs)
  const secNaga   = bySlugs(['naga-sroda'])
  const secTam    = bySlugs(['tam-i-tam'])
  const secFel    = bySlugs(['felieton'])
  const secWiedza = bySlugs(['cnm-101', 'pierwszy-raz', 'bez-osadu'])

  // Hero from the monthly theme; fallback to newest article (never a placeholder).
  const newest = byDate(allArticles)[0]
  // Pinned theme image wins (stable hero); dynamic cover only as fallback.
  const heroImage = theme?.image || secTemat[0]?.cover_image || newest?.cover_image
  const heroVideo = theme?.video || null
  const heroLabel = theme?.label || 'ExtraFun · Magazyn'
  const heroTitle = theme?.title || newest?.title || 'Magazyn'
  const heroLead  = theme?.lead  || newest?.description || ''

  // Archiwum = wszystko POZA tym, co już pokazane w blokach wyżej (bez dubli).
  const shownIds = new Set([
    ...secTemat.slice(0, 12),
    ...secNaga.slice(0, 3),
    ...secTam.slice(0, 3),
    ...secFel.slice(0, 3),
    ...secWiedza.slice(0, 3),
  ].map(a => a.id))
  const archPool = allArticles.filter(a => !shownIds.has(a.id))

  // Filtr z kategorii realnie obecnych w archiwum — bez pustych tabów.
  const presentCats = Array.from(new Set(archPool.map(a => a.category))).sort((a, b) => a.localeCompare(b, 'pl'))
  const archCategories = ['Wszystkie', ...presentCats]
  const archFiltered = activeCategory === 'Wszystkie'
    ? byDate(archPool)
    : byDate(archPool.filter(a => a.category === activeCategory))

  const openArticle = (a) => navigate(`/magazyn/${a.slug}`)
  const goRubryka = (slug) => navigate(`/magazyn/rubryka/${slug}`)

  if (showQuiz) return <QuizView onBack={() => {
    setShowQuiz(false)
    try { setQuizDone(localStorage.getItem('ef_quiz_dogging_done') === '1') } catch {}
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

      {/* Hero = Temat Miesiąca (parasol) — sterowany configiem theme-month.
          Tekst na zdjęciu (scrim wbudowany w Hero). Quiz przeniesiony do
          sidebara (Quiz na górze). */}
      {/* Desktop hero; on mobile the theme is the first tile of the feed. */}
      <div className="hidden lg:block">
        <Hero image={heroImage} video={heroVideo} imagePosition="center 38%" label={heroLabel} onLabel={() => goRubryka('temat')} title={heroTitle} lead={heroLead} italic={false} />
      </div>

      {/* Rytm tygodnia — 4 kręgosłup-rubryki (desktop; mobile = płaska lista) */}
      <nav className="hidden lg:block max-w-container-max mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 border-y border-outline-variant/40 mb-14">
          {[
            ['Pon · Pt', 'Temat Miesiąca', 'temat'],
            ['Wtorek', 'Tam i Tam', 'tam-i-tam'],
            ['Środa', 'Naga Środa', 'naga-sroda'],
            ['Sobota', 'Felieton', 'felieton'],
          ].map(([day, nm, rslug], i) => (
            <button
              key={rslug}
              onClick={() => goRubryka(rslug)}
              className={`text-center py-4 px-3 hover:bg-primary-container/5 transition-colors border-outline-variant/40 ${i < 3 ? 'md:border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''}`}
            >
              <div className="font-body text-label-caps uppercase text-primary-container">{day}</div>
              <div className="font-display text-headline-sm text-on-surface mt-1">{nm}</div>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-container-max mx-auto px-6 md:px-16 pb-24">

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-8">

        {/* MOBILE — kafelki pełnoekranowe (IG/Reels): temat → artykuły od najnowszego */}
        <MagazynMobileFeed
          theme={theme}
          themeSlug={themeSlugs[0] || 'temat'}
          themeArticles={secTemat}
          articles={byDate(allArticles)}
          popular={[...allArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)}
          quizDone={quizDone}
          onStartQuiz={() => setShowQuiz(true)}
        />

        {/* DESKTOP — magazyn sekcyjny */}
        <div className="hidden lg:block">
        {/* Bloki per rubryka — kolejność = rytm tygodnia. Puste znikają. */}
        <RubrykaSection
          id="sec-temat"
          label={themeName ? `Temat Miesiąca · ${themeName}` : 'Temat Miesiąca'}
          articles={secTemat}
          onOpen={openArticle}
          onMore={() => goRubryka('temat')}
          moreLabel="Cały numer →"
          layout="feature"
          limit={12}
        />
        <RubrykaSection
          id="sec-naga" label="Naga Środa" articles={secNaga}
          onOpen={openArticle} onMore={() => goRubryka('naga-sroda')} limit={3}
        />
        <RubrykaSection
          id="sec-tam" label="Tam i Tam" articles={secTam}
          onOpen={openArticle} onMore={() => goRubryka('tam-i-tam')}
          layout={secTam.length === 1 ? 'wide' : 'row'} limit={3}
        />
        <RubrykaSection
          id="sec-felieton" label="Felieton" articles={secFel}
          onOpen={openArticle} onMore={() => goRubryka('felieton')} limit={3}
        />
        <RubrykaSection
          id="sec-wiedza" label="Wiedza · CNM 101 · Pierwszy Raz · Bez Osądu"
          articles={secWiedza} onOpen={openArticle} onMore={() => goRubryka('wiedza')} limit={3}
        />

        {/* Archiwum — cały katalog z filtrem (kategorie realnie obecne) */}
        <section id="archiwum" className="scroll-mt-24 mt-8">
          <MagSectionHeader label="Więcej / Archiwum" />
          <div className="flex flex-wrap gap-x-7 gap-y-3 mb-12">
            {archCategories.map(cat => (
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
          {archFiltered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
              {archFiltered.map(article => (
                <MagCard
                  key={article.id}
                  image={article.cover_image}
                  tag={article.category}
                  title={article.title}
                  lead={article.description}
                  meta={`${article.reading_time} min`}
                  size="sm"
                  onClick={() => openArticle(article)}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="font-display text-headline-sm text-on-surface mb-2">Brak artykułów</div>
              <div className="font-body text-body-md text-on-surface-variant">W tej kategorii nie ma jeszcze żadnych artykułów.</div>
            </div>
          )}
        </section>
        </div>{/* /desktop magazyn */}

          </div>{/* /content col */}

          <aside className="mt-16 lg:mt-0 lg:col-span-4">
            <div>
              <SiteRail onStartQuiz={() => setShowQuiz(true)} quizDone={quizDone} />
            </div>
          </aside>
        </div>{/* /magazyn grid */}

        {/* Kalendarz — pełna szerokość pod treścią (słówko/quiz są w sidebarze) */}
        <section className="mt-24 max-w-lg">
          <CalendarWidget />
        </section>
      </main>
    </div>
  )
}
