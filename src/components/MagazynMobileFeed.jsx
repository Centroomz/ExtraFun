import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { QUIZ_TITLE, QUIZ_INTRO } from '../lib/quiz-dogging'

// Mobile /magazyn = full-screen tiles, Instagram/Reels logic (spec 2026-09-17,
// faza B): swipe down = next piece, swipe right inside a tile = more of the same
// (theme articles), tap = open. Reading itself stays on the article page —
// tiles are for browsing, not reading.

// Tile height: viewport minus sticky mobile topbar (56px) and the bottom nav.
const TILE_H = 'h-[calc(100dvh-56px-var(--nav-height)-env(safe-area-inset-bottom))]'
// Same bottom scrim as nocturne/Hero — text sits on the cover, never on bare image.
const SCRIM = 'linear-gradient(0deg, rgba(18,20,20,.96) 0%, rgba(18,20,20,.75) 35%, rgba(18,20,20,.25) 65%, rgba(18,20,20,.05) 100%)'

const HOOK_MAX = 140
const PARA_MAX = 280

function clip(text, max) {
  const t = (text || '').trim()
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

// First body paragraph. Content is md-lite for most articles but raw HTML for
// the SwingTowns-adapted ones — strip tags first, then skip headings/lists/blanks
// and drop **bold** / [link](url) markers.
// `skip` = title/excerpt: some articles repeat the title (or the hook) as the
// first body line — that is not a paragraph.
export function firstParagraph(content, skip = []) {
  // Near-duplicate check (the in-body title often differs by a word from the DB
  // title): share >= 70% of the shorter one's words -> same thing, skip it.
  const words = (t) => new Set((t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(w => w.length > 2))
  const skipWords = skip.map(words).filter(w => w.size)
  const isDup = (line) => {
    const lw = words(line)
    if (!lw.size) return false
    return skipWords.some(sw => {
      const small = lw.size <= sw.size ? lw : sw, big = small === lw ? sw : lw
      let hit = 0; for (const w of small) if (big.has(w)) hit++
      return hit / small.size >= 0.7
    })
  }
  const text = (content || '')
    .replace(/<(h[1-6]|li)[^>]*>[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<\/(p|div)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  const line = text.split('\n').map(l => l.trim())
    .find(l => l && !l.startsWith('#') && !l.startsWith('- ') && !l.startsWith('![') && !isDup(l))
  return (line || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}


/* ── Snap container: sets y-snap on <html> while mounted (window scrolls on mobile) ── */
function useHtmlSnap(enabled) {
  useEffect(() => {
    // Desktop scrolls .page-content, not <html> — only touch the root below lg.
    if (!enabled || !window.matchMedia('(max-width: 1023px)').matches) return
    const el = document.documentElement
    const prev = { snap: el.style.scrollSnapType, pad: el.style.scrollPaddingTop }
    el.style.scrollSnapType = 'y proximity'
    el.style.scrollPaddingTop = '56px'
    return () => { el.style.scrollSnapType = prev.snap; el.style.scrollPaddingTop = prev.pad }
  }, [enabled])
}

/* ── Cover + scrim shared by article-like tiles ── */
function Cover({ image, video, position = 'center' }) {
  return (
    <div className="absolute inset-0">
      {video
        ? <video className="w-full h-full object-cover" autoPlay muted loop playsInline poster={image || undefined} src={video} />
        : image
          ? <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: position }} />
          : <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />}
      <div className="absolute inset-0" style={{ background: SCRIM }} />
    </div>
  )
}

/* ── Article tile: cover, category, title, hook, first paragraph, meta ── */
function ArticleTile({ article, label, className = '' }) {
  return (
    <Link href={`/magazyn/${article.slug}`} className={`relative block w-full ${TILE_H} snap-start overflow-hidden no-underline ${className}`}>
      <Cover image={article.cover_image} position="center 30%" />
      <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6">
        <span className="font-body text-label-caps uppercase text-primary-container block mb-2">{label || article.category}</span>
        <h2 className="font-display font-semibold text-headline-md text-on-surface leading-tight mb-3 line-clamp-3">{article.title}</h2>
        {article.description && (
          <p className="font-body text-body-lg text-on-surface leading-snug mb-3 line-clamp-3">{clip(article.description, HOOK_MAX)}</p>
        )}
        {article.firstParagraph && (
          <p className="font-body text-body-md text-on-surface-variant leading-relaxed mb-4 line-clamp-4">{clip(article.firstParagraph, PARA_MAX)}</p>
        )}
        <span className="font-body text-label-caps uppercase text-primary-container">
          {article.reading_time ? `${article.reading_time} min · ` : ''}Czytaj →
        </span>
      </div>
    </Link>
  )
}

/* ── Dots for a horizontal strip ── */
function Dots({ count, active }) {
  if (count < 2) return null
  return (
    <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`h-1 rounded-full transition-all ${i === active ? 'w-4 bg-primary-container' : 'w-1 bg-on-surface/40'}`} />
      ))}
    </div>
  )
}

/* ── Theme tile: hero slide + theme articles to the right ── */
function ThemeTile({ theme, articles, themeSlug }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const slides = 1 + articles.length
  const onScroll = () => {
    const el = ref.current
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth))
  }
  return (
    <div className={`relative w-full ${TILE_H} snap-start overflow-hidden`}>
      <Dots count={slides} active={active} />
      <div ref={ref} onScroll={onScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none">
        <Link href={`/magazyn/rubryka/${themeSlug}`} className="relative block shrink-0 w-full h-full snap-start no-underline">
          <Cover image={theme.image} video={theme.video} position="center 38%" />
          <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6">
            <span className="font-body text-label-caps uppercase text-primary-container block mb-2">{theme.label} →</span>
            <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-none mb-3">{theme.title}</h1>
            {theme.lead && <p className="font-body text-body-lg text-on-surface-variant leading-snug line-clamp-4">{theme.lead}</p>}
            {articles.length > 0 && (
              <span className="font-body text-label-caps uppercase text-primary-container block mt-4">{articles.length} tekstów · przesuń →</span>
            )}
          </div>
        </Link>
        {articles.map(a => (
          <ArticleTile key={a.id} article={a} label="Temat Miesiąca" className="shrink-0 snap-start" />
        ))}
      </div>
    </div>
  )
}

/* ── Quiz tile (rail module as a tile) ── */
function QuizTile({ onStart }) {
  return (
    <button onClick={onStart} className={`relative block w-full ${TILE_H} snap-start text-left px-margin-mobile flex flex-col justify-center`}
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.03))' }}>
      <span className="font-body text-label-caps uppercase text-primary-container block mb-3">Quiz miesiąca</span>
      <h2 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-none mb-4">{QUIZ_TITLE}</h2>
      <p className="font-body text-body-lg text-on-surface-variant leading-snug mb-6">{QUIZ_INTRO}</p>
      <span className="font-body text-label-caps uppercase text-primary-container">Zacznij →</span>
    </button>
  )
}

/* ── Popular tile: "Najczęściej czytane" as a tile with cover thumbnails ── */
function PopularTile({ items }) {
  if (!items.length) return null
  return (
    <div className={`relative w-full ${TILE_H} snap-start px-margin-mobile flex flex-col justify-center bg-surface-container-low`}>
      <span className="font-body text-label-caps uppercase text-primary-container block mb-5">Najczęściej czytane</span>
      <ol className="list-none p-0 m-0 space-y-4">
        {items.map((a, i) => (
          <li key={a.slug}>
            <Link href={`/magazyn/${a.slug}`} className="flex gap-4 items-center no-underline">
              <span className="font-display text-headline-sm text-primary-container/50 w-6 shrink-0">{i + 1}</span>
              {a.cover_image && <img src={a.cover_image} alt="" loading="lazy" className="w-16 h-16 object-cover shrink-0" />}
              <span className="font-display text-headline-sm text-on-surface leading-tight line-clamp-2">{a.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * @param theme         getMonthTheme() result or null
 * @param themeArticles theme's articles, newest first
 * @param articles      all articles, newest first (each with firstParagraph)
 * @param popular       top 5 by views
 */
export function MagazynMobileFeed({ theme, themeSlug, themeArticles, articles, popular, quizDone, onStartQuiz }) {
  useHtmlSnap(true)
  const tiles = []
  if (theme) tiles.push(<ThemeTile key="theme" theme={theme} articles={themeArticles} themeSlug={themeSlug} />)
  articles.forEach((a, i) => {
    tiles.push(<ArticleTile key={a.id} article={a} />)
    if (i === 1 && !quizDone) tiles.push(<QuizTile key="quiz" onStart={onStartQuiz} />)
    if (i === 4) tiles.push(<PopularTile key="popular" items={popular} />)
  })
  return <div className="lg:hidden -mx-6">{tiles}</div>
}
