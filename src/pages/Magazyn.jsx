import { useState } from 'react'
import { getWordOfTheDay } from '../lib/dictionary'
import { ARTICLES, CATEGORIES, getArticlesByCategory } from '../lib/articles'
import { QUIZ_QUESTIONS, interpretQuizResult } from '../lib/quiz'

const CATEGORY_COLORS = {
  'CNM 101': { bg: 'rgba(0,229,255,0.12)', color: '#00E5FF', border: 'rgba(0,229,255,0.3)' },
  'Pierwszy Raz': { bg: 'rgba(255,0,128,0.12)', color: '#FF0080', border: 'rgba(255,0,128,0.3)' },
  'Bez Osądu': { bg: 'rgba(157,78,221,0.12)', color: '#9D4EDD', border: 'rgba(157,78,221,0.3)' },
  'Tam i Tam': { bg: 'rgba(255,165,0,0.12)', color: '#FFA500', border: 'rgba(255,165,0,0.3)' },
  'Słownik': { bg: 'rgba(0,255,150,0.12)', color: '#00FF96', border: 'rgba(0,255,150,0.3)' },
}

function ArticleDetail({ article, onBack }) {
  const lines = article.content.trim().split('\n')
  const rendered = lines.map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>
    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>
    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
    if (line.startsWith('- ')) return <li key={i}>{parseBold(line.slice(2))}</li>
    if (line.trim() === '') return null
    return <p key={i}>{parseBold(line)}</p>
  })

  function parseBold(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
  }

  const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 16 }}>Artykuł</h1>
      </div>
      <div className="article-detail">
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            className="article-card-tag"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
          >
            {article.category}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{article.reading_time} min czytania</span>
        </div>
        {rendered}
      </div>
    </div>
  )
}

function QuizView({ onBack }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)

  const q = QUIZ_QUESTIONS[current]
  const total = QUIZ_QUESTIONS.length

  const handleAnswer = (points) => {
    setSelected(points)
  }

  const handleNext = () => {
    const newAnswers = [...answers, selected]
    if (current + 1 < total) {
      setAnswers(newAnswers)
      setCurrent(current + 1)
      setSelected(null)
    } else {
      const totalPoints = newAnswers.reduce((sum, p) => sum + p, 0)
      setResult(interpretQuizResult(totalPoints))
      setDone(true)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 16 }}>Quiz</h1>
      </div>

      <div className="quiz-container">
        {!done ? (
          <>
            <div className="quiz-progress">
              <div className="quiz-progress-fill" style={{ width: `${((current) / total) * 100}%` }} />
            </div>
            <div className="quiz-question-num">Pytanie {current + 1} z {total}</div>
            <div className="quiz-question">{q.question}</div>
            <div className="quiz-answers">
              {q.answers.map((a, i) => (
                <button
                  key={i}
                  className={`quiz-answer ${selected === a.points ? 'selected' : ''}`}
                  onClick={() => handleAnswer(a.points)}
                >
                  {a.text}
                </button>
              ))}
            </div>
            {selected !== null && (
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 20 }}
                onClick={handleNext}
              >
                {current + 1 < total ? 'Następne pytanie →' : 'Zobacz wynik →'}
              </button>
            )}
          </>
        ) : (
          <div className="quiz-result">
            <span className="quiz-result-emoji">{result.emoji}</span>
            <h2 className="quiz-result-title" style={{ color: result.color }}>{result.title}</h2>
            <p className="quiz-result-desc">{result.description}</p>
            <p className="quiz-result-score">
              Twój wynik: {answers.reduce((s, p) => s + p, 0)}/{total * 3} pkt
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onBack}>
              Wróć do Magazynu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Magazyn() {
  const [activeCategory, setActiveCategory] = useState('Wszystkie')
  const [view, setView] = useState('home') // home | quiz | article
  const [selectedArticle, setSelectedArticle] = useState(null)

  const word = getWordOfTheDay()
  const articles = getArticlesByCategory(activeCategory)

  if (view === 'quiz') return <QuizView onBack={() => setView('home')} />
  if (view === 'article' && selectedArticle) return (
    <ArticleDetail article={selectedArticle} onBack={() => { setView('home'); setSelectedArticle(null) }} />
  )

  return (
    <div>
      <div className="page-header">
        <h1>📰 Magazyn</h1>
      </div>

      {/* Hero Quiz */}
      <div className="hero-quiz" onClick={() => setView('quiz')} style={{ cursor: 'pointer' }}>
        <div className="hero-quiz-label">✨ Quiz tygodnia</div>
        <h2 className="hero-quiz-title">Czy CNM jest dla Ciebie?</h2>
        <p className="hero-quiz-desc">
          12 pytań, które pomogą Ci lepiej zrozumieć, czy poliamoria, swinging lub inne formy CNM pasują do Twojego stylu życia.
        </p>
        <button className="btn-primary" onClick={() => setView('quiz')}>
          Zacznij quiz →
        </button>
      </div>

      {/* Word of the Day */}
      <div className="word-of-day">
        <div className="word-of-day-label">📖 Słówko dnia</div>
        <div className="word-of-day-term">{word.term}</div>
        <div className="word-of-day-def">{word.definition}</div>
        <span className="word-of-day-badge">{word.category}</span>
      </div>

      {/* Category filter */}
      <div className="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article grid */}
      <div className="article-grid">
        {articles.map(article => {
          const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['CNM 101']
          return (
            <div
              key={article.id}
              className="article-card"
              onClick={() => { setSelectedArticle(article); setView('article') }}
            >
              <span
                className="article-card-tag"
                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
              >
                {article.category}
              </span>
              <div className="article-card-title">{article.title}</div>
              <div className="article-card-desc">{article.description}</div>
              <div className="article-card-meta">{article.reading_time} min czytania</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
