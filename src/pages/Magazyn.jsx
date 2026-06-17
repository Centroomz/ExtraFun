import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { getWordOfTheDay } from '../lib/dictionary'
import { ARTICLES as FALLBACK_ARTICLES, CATEGORIES } from '../lib/articles'
import { QUIZ_QUESTIONS, interpretQuizResult } from '../lib/quiz'
import { apiFetch } from '../lib/api'
import { CalendarWidget } from '../components/CalendarWidget'

const BASE_URL = 'https://extrafun.pl'

function estimateReadingTime(content) {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200))
}

const CATEGORY_COLORS = {
  'CNM 101':        { bg: 'rgba(233,193,118,0.12)',   color: '#e9c176', border: 'rgba(233,193,118,0.3)' },
  'Pierwszy Raz':   { bg: 'rgba(157,78,222,0.12)',   color: '#9D4EDE', border: 'rgba(157,78,222,0.3)' },
  'Bez Osądu':      { bg: 'rgba(157,78,221,0.12)',  color: '#9D4EDE', border: 'rgba(157,78,221,0.3)' },
  'Tam i Tam':      { bg: 'rgba(255,165,0,0.12)',   color: '#FFA500', border: 'rgba(255,165,0,0.3)' },
  'Słownik':        { bg: 'rgba(0,255,150,0.12)',   color: '#00FF96', border: 'rgba(0,255,150,0.3)' },
  'Temat Miesiąca': { bg: 'rgba(255,200,0,0.12)',   color: '#FFC800', border: 'rgba(255,200,0,0.3)' },
}

const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'pierwszy-raz':   'Pierwszy Raz',
  'bez-osadu':      'Bez Osądu',
  'tam-i-tam':      'Tam i Tam',
  'slownik':        'Słownik',
  'temat-miesiaca': 'Temat Miesiąca',
}

/* ─── Quiz View (inline, no URL needed) ──────────────────────── */
function QuizView({ onBack }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)

  const q = QUIZ_QUESTIONS[current]
  const total = QUIZ_QUESTIONS.length

  const handleNext = () => {
    const newAnswers = [...answers, selected]
    if (current + 1 < total) {
      setAnswers(newAnswers); setCurrent(current + 1); setSelected(null)
    } else {
      const totalPoints = newAnswers.reduce((s, p) => s + p, 0)
      setResult(interpretQuizResult(totalPoints)); setDone(true)
    }
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
              {q.answers.map((a, i) => (
                <button key={i} className={`quiz-answer ${selected === a.points ? 'selected' : ''}`}
                  onClick={() => setSelected(a.points)}>{a.text}</button>
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
            <p className="quiz-result-score">Wynik: {answers.reduce((s, p) => s + p, 0)}/{total * 3} pkt</p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onBack}>Wróć do Magazynu</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Category Tag ────────────────────────────────────────────── */
function CatTag({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS['CNM 101']
  return (
    <span className="article-card-tag" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {category}
    </span>
  )
}

/* ─── Magazyn Main ────────────────────────────────────────────── */
export function Magazyn() {
  const [activeCategory, setActiveCategory] = useState('Wszystkie')
  const [showQuiz, setShowQuiz] = useState(false)
  const [dbArticles, setDbArticles] = useState(null)

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

  const hero = filtered.find(a => a.featured) || filtered[0]
  const rest = filtered.filter(a => a !== hero)

  if (showQuiz) return <QuizView onBack={() => setShowQuiz(false)} />

  return (
    <div className="mag-root">
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

      {/* ── Masthead ── */}
      <header className="mag-masthead">
        <div className="mag-masthead-inner">
          <div className="mag-brand">
            <span className="mag-brand-name">ExtraFun</span>
            <span className="mag-brand-divider" />
            <span className="mag-brand-issue">Wydanie 2 · Czerwiec 2026</span>
          </div>
          <nav className="mag-cats">
            {CATEGORIES.map(cat => (
              <button key={cat}
                className={`mag-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Mobile header ── */}
      <div className="mag-mobile-header">
        <h1 className="mag-mobile-title">Magazyn</h1>
        <div className="category-filter">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="mag-layout">
        <main className="mag-content">

          {/* Hero */}
          {hero && (
            <Link href={`/magazyn/${hero.slug}`}>
              <article className="mag-hero" style={{ cursor: 'pointer' }}>
                {hero.cover_image
                  ? <img src={hero.cover_image} className="mag-hero-img" alt={hero.title} />
                  : <div className="mag-hero-img mag-hero-img--placeholder" />
                }
                <div className="mag-hero-body">
                  <CatTag category={hero.category} />
                  <h2 className="mag-hero-title">{hero.title}</h2>
                  <p className="mag-hero-desc">{hero.description}</p>
                  <div className="mag-hero-meta">
                    <span>{hero.reading_time} min czytania</span>
                    <span className="mag-hero-cta">Czytaj →</span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="mag-grid">
              {rest.map(article => (
                <Link key={article.id} href={`/magazyn/${article.slug}`}>
                  <article className="mag-card" style={{ cursor: 'pointer' }}>
                    {article.cover_image && (
                      <div className="mag-card-img-wrap">
                        <img src={article.cover_image} className="mag-card-img" alt={article.title} />
                      </div>
                    )}
                    <div className="mag-card-body">
                      <CatTag category={article.category} />
                      <h3 className="mag-card-title">{article.title}</h3>
                      <p className="mag-card-desc">{article.description}</p>
                      <span className="mag-card-meta">{article.reading_time} min czytania</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: '80px 24px' }}>
              <div className="empty-icon">📭</div>
              <div className="empty-title">Brak artykułów</div>
              <div className="empty-desc">W tej kategorii nie ma jeszcze żadnych artykułów.</div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="mag-sidebar">
          <CalendarWidget />

          <div className="mag-sidebar-quiz" onClick={() => setShowQuiz(true)} style={{ cursor: 'pointer' }}>
            <div className="mag-sidebar-quiz-label">✨ Quiz tygodnia</div>
            <div className="mag-sidebar-quiz-title">Czy CNM jest dla Ciebie?</div>
            <div className="mag-sidebar-quiz-desc">12 pytań które pomogą zrozumieć siebie</div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 16, fontSize: 13, padding: '10px 16px' }}>
              Zacznij →
            </button>
          </div>

          <div className="mag-sidebar-word">
            <div className="mag-sidebar-word-label">📖 Słówko dnia</div>
            <div className="mag-sidebar-word-term">{word.term}</div>
            <div className="mag-sidebar-word-def">{word.definition}</div>
            <span className="word-of-day-badge">{word.category}</span>
          </div>

          {rest.length > 2 && (
            <div className="mag-sidebar-more">
              <div className="mag-sidebar-more-label">Więcej artykułów</div>
              {rest.slice(0, 4).map(a => (
                <Link key={a.id} href={`/magazyn/${a.slug}`}>
                  <div className="mag-sidebar-item" style={{ cursor: 'pointer' }}>
                    {a.cover_image && <img src={a.cover_image} className="mag-sidebar-item-img" alt="" />}
                    <div className="mag-sidebar-item-body">
                      <CatTag category={a.category} />
                      <div className="mag-sidebar-item-title">{a.title}</div>
                      <div className="mag-sidebar-item-meta">{a.reading_time} min</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
