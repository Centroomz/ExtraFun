import { useState, useEffect } from 'react'
import { getWordOfTheDay } from '../lib/dictionary'
import { ARTICLES as FALLBACK_ARTICLES, CATEGORIES, getArticlesByCategory } from '../lib/articles'
import { QUIZ_QUESTIONS, interpretQuizResult } from '../lib/quiz'
import { supabase } from '../lib/supabase'

function estimateReadingTime(content) {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200))
}

const CATEGORY_COLORS = {
  'CNM 101':       { bg: 'rgba(0,229,255,0.12)',   color: '#00E5FF', border: 'rgba(0,229,255,0.3)' },
  'Pierwszy Raz':  { bg: 'rgba(255,0,128,0.12)',   color: '#FF0080', border: 'rgba(255,0,128,0.3)' },
  'Bez Osądu':     { bg: 'rgba(157,78,221,0.12)',  color: '#9D4EDD', border: 'rgba(157,78,221,0.3)' },
  'Tam i Tam':     { bg: 'rgba(255,165,0,0.12)',   color: '#FFA500', border: 'rgba(255,165,0,0.3)' },
  'Słownik':       { bg: 'rgba(0,255,150,0.12)',   color: '#00FF96', border: 'rgba(0,255,150,0.3)' },
  'Temat Miesiąca':{ bg: 'rgba(255,200,0,0.12)',   color: '#FFC800', border: 'rgba(255,200,0,0.3)' },
}

const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'pierwszy-raz':   'Pierwszy Raz',
  'bez-osadu':      'Bez Osądu',
  'tam-i-tam':      'Tam i Tam',
  'slownik':        'Słownik',
  'temat-miesiaca': 'Temat Miesiąca',
}

/* ─── Article Detail ──────────────────────────────────────────── */
function ArticleDetail({ article, onBack }) {
  const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']

  const lines = article.content.trim().split('\n')
  const rendered = lines.map((line, i) => {
    if (line.startsWith('# '))   return <h1 key={i}>{parseBold(line.slice(2))}</h1>
    if (line.startsWith('## '))  return <h2 key={i}>{parseBold(line.slice(3))}</h2>
    if (line.startsWith('### ')) return <h3 key={i}>{parseBold(line.slice(4))}</h3>
    if (line.startsWith('- '))   return <li key={i}>{parseBold(line.slice(2))}</li>
    if (line.trim() === '')      return null
    return <p key={i}>{parseBold(line)}</p>
  })

  function parseBold(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
  }

  return (
    <div className="mag-root">
      {/* Back bar */}
      <div className="mag-article-bar">
        <button className="mag-back-btn" onClick={onBack}>
          ← Powrót
        </button>
        <span className="article-card-tag" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
          {article.category}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{article.reading_time} min czytania</span>
      </div>

      {/* Hero image */}
      {article.cover_image && (
        <div className="mag-article-hero">
          <img src={article.cover_image} alt={article.title} />
          <div className="mag-article-hero-overlay" />
        </div>
      )}

      {/* Content */}
      <div className="mag-article-body">
        <div className="article-detail">
          {rendered}
        </div>
      </div>
    </div>
  )
}

/* ─── Quiz View ───────────────────────────────────────────────── */
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
            <p className="quiz-result-score">Wynik: {answers.reduce((s,p)=>s+p,0)}/{total*3} pkt</p>
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
  const [view, setView] = useState('home')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [dbArticles, setDbArticles] = useState(null)

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, excerpt, content, category_slug, cover_image, featured')
      .eq('site', 'extrafun')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setDbArticles([])
        } else {
          setDbArticles(data.map(a => ({
            id: a.id,
            title: a.title,
            description: a.excerpt || '',
            category: SLUG_TO_DISPLAY[a.category_slug] || a.category_slug || 'CNM 101',
            reading_time: a.reading_time || estimateReadingTime(a.content),
            content: a.content || '',
            cover_image: a.cover_image || null,
            featured: a.featured || false,
          })))
        }
      })
  }, [])

  const allArticles = (dbArticles && dbArticles.length > 0) ? dbArticles : FALLBACK_ARTICLES
  const word = getWordOfTheDay()

  const filtered = activeCategory === 'Wszystkie'
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory)

  const openArticle = (art) => { setSelectedArticle(art); setView('article') }

  // Hero = first featured, or first article
  const hero = filtered.find(a => a.featured) || filtered[0]
  const rest  = filtered.filter(a => a !== hero)

  if (view === 'quiz')    return <QuizView onBack={() => setView('home')} />
  if (view === 'article' && selectedArticle)
    return <ArticleDetail article={selectedArticle} onBack={() => { setView('home'); setSelectedArticle(null) }} />

  return (
    <div className="mag-root">

      {/* ── Masthead ────────────────────────────────── */}
      <header className="mag-masthead">
        <div className="mag-masthead-inner">
          <div className="mag-brand">
            <span className="mag-brand-name">ExtraFun</span>
            <span className="mag-brand-divider" />
            <span className="mag-brand-issue">Wydanie 1 · Maj 2025</span>
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

      {/* ── Mobile header (hidden on desktop) ──────── */}
      <div className="mag-mobile-header">
        <h1 className="mag-mobile-title">Magazyn</h1>
        <div className="category-filter">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────── */}
      <div className="mag-layout">

        {/* Content column */}
        <main className="mag-content">

          {/* Hero article */}
          {hero && (
            <article className="mag-hero" onClick={() => openArticle(hero)}>
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
          )}

          {/* Article grid */}
          {rest.length > 0 && (
            <div className="mag-grid">
              {rest.map(article => {
                const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']
                return (
                  <article key={article.id} className="mag-card" onClick={() => openArticle(article)}>
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
                )
              })}
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

          {/* Quiz CTA */}
          <div className="mag-sidebar-quiz" onClick={() => setView('quiz')}>
            <div className="mag-sidebar-quiz-label">✨ Quiz tygodnia</div>
            <div className="mag-sidebar-quiz-title">Czy CNM jest dla Ciebie?</div>
            <div className="mag-sidebar-quiz-desc">12 pytań które pomogą zrozumieć siebie</div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 16, fontSize: 13, padding: '10px 16px' }}>
              Zacznij →
            </button>
          </div>

          {/* Word of Day */}
          <div className="mag-sidebar-word">
            <div className="mag-sidebar-word-label">📖 Słówko dnia</div>
            <div className="mag-sidebar-word-term">{word.term}</div>
            <div className="mag-sidebar-word-def">{word.definition}</div>
            <span className="word-of-day-badge">{word.category}</span>
          </div>

          {/* More articles - compact list */}
          {rest.length > 2 && (
            <div className="mag-sidebar-more">
              <div className="mag-sidebar-more-label">Więcej artykułów</div>
              {rest.slice(0, 4).map(a => (
                <div key={a.id} className="mag-sidebar-item" onClick={() => openArticle(a)}>
                  {a.cover_image && <img src={a.cover_image} className="mag-sidebar-item-img" alt="" />}
                  <div className="mag-sidebar-item-body">
                    <CatTag category={a.category} />
                    <div className="mag-sidebar-item-title">{a.title}</div>
                    <div className="mag-sidebar-item-meta">{a.reading_time} min</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </aside>
      </div>
    </div>
  )
}
