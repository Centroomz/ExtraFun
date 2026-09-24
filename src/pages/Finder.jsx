import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { Button } from '../components/nocturne'
import { useAuth } from '../hooks/useAuth'
import { FinderProfile } from './FinderProfile'

const MODES = [
  { id: 'all', label: 'Wszyscy' },
  { id: 'photos', label: 'Ze zdjęciem' },
  { id: 'gallery', label: 'Z galerią' },
  { id: 'new', label: 'Nowi' },
  { id: 'active', label: 'Aktywni' },
]

const PAGE_SIZE = 24

// Same deterministic gradient set as biz's Szukaj (seed = user id) — a
// photoless card gets a colored tile instead of a flat gray box.
const GRADIENTS = [
  'linear-gradient(135deg,#ff6b6b,#ee5a9c)',
  'linear-gradient(135deg,#f7971e,#ffd200)',
  'linear-gradient(135deg,#11998e,#38ef7d)',
  'linear-gradient(135deg,#396afc,#2948ff)',
  'linear-gradient(135deg,#8e2de2,#4a00e0)',
  'linear-gradient(135deg,#ff512f,#dd2476)',
  'linear-gradient(135deg,#1fa2ff,#12d8fa)',
  'linear-gradient(135deg,#f857a6,#ff5858)',
]
function gradientFor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function FinderAvatar({ id, url, name }) {
  const [ok, setOk] = useState(!!url)
  return url && ok
    ? <img src={url} alt="" onError={() => setOk(false)} className="w-full aspect-square object-cover" />
    : (
      <div className="w-full aspect-square flex items-center justify-center" style={{ background: gradientFor(id) }}>
        <span className="font-display text-display-sm-mobile font-bold" style={{ color: 'rgba(255,255,255,.92)', textShadow: '0 2px 8px rgba(0,0,0,.35)' }}>
          {name?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
    )
}

function FinderCard({ p, onOpen }) {
  return (
    <button onClick={onOpen} className="text-left border border-outline-variant/20 bg-surface-container-low hover:border-primary-container/40 transition-colors">
      <FinderAvatar id={p.id} url={p.avatarUrl} name={p.displayName} />
      <div className="p-3">
        <div className="font-body font-semibold text-body-md text-on-surface">
          {p.displayName}{p.age ? `, ${p.age}` : ''}
        </div>
        {p.lookingFor && (
          <div className="font-body text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{p.lookingFor}</div>
        )}
      </div>
    </button>
  )
}

// Phase 1 — read-only. Backend keeps FINDER_LIVE=false until the Phase-3 consent
// broadcast, so everyone (guest and logged-in) gets {count, locked:true} — real
// rows never leave the server. The grid/filters below are wired and ready for
// when Phase 3 flips the gate; until then this always renders the locked state.
export function Finder({ user }) {
  const { profile } = useAuth()
  const [state, setState] = useState({ loading: true, locked: true, count: 0, items: [], stats: null })
  const [mode, setMode] = useState('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [page, setPage] = useState(1)

  // A filter change should always land back on page 1 — otherwise "page 5"
  // of "Wszyscy" silently becomes an out-of-range page of "Ze zdjęciem".
  useEffect(() => { setPage(1) }, [mode, q])

  // Opening a profile pushes a history entry so Back closes it instead of
  // leaving the page — same pattern as Ogloszenia's ad detail.
  useEffect(() => {
    if (selectedId == null) return
    window.scrollTo(0, 0)
    document.querySelector('.page-content')?.scrollTo(0, 0)
    window.history.pushState({ efFinderDetail: true }, '')
    const onPop = () => setSelectedId(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [selectedId])

  useEffect(() => {
    let alive = true
    setState(s => ({ ...s, loading: true }))
    const params = new URLSearchParams({ mode })
    if (q.trim()) params.set('q', q.trim())
    apiFetch(`/api/finder?${params}`)
      .then(d => { if (alive) setState({ loading: false, locked: !!d.locked, count: d.count || 0, items: d.items || [], stats: d.stats || null }) })
      .catch(() => { if (alive) setState(s => ({ ...s, loading: false })) })
    return () => { alive = false }
  }, [mode, q])

  if (selectedId) {
    return (
      <FinderProfile
        id={selectedId}
        onBack={() => window.history.back()}
        onBlocked={() => window.history.back()}
      />
    )
  }

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <main className="max-w-5xl mx-auto px-6 md:px-16 pt-8 pb-24">
        <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-tight mb-6">Szukaj</h1>

        {state.loading ? (
          <p className="font-body text-body-md text-on-surface-variant">Ładowanie…</p>
        ) : state.locked ? (
          <div className="border border-outline-variant/20 p-8 text-center">
            <p className="font-body text-body-lg text-on-surface mb-2">Katalog profili wkrótce.</p>
            <p className="font-body text-body-md text-on-surface-variant mb-6">
              {state.count > 0 ? `Czeka tu ${state.count} osób.` : 'Trwa uzupełnianie profili.'}
            </p>
            {!user && <Button onClick={() => (window.location.href = '/login')}>Zaloguj się</Button>}
          </div>
        ) : (
          <>
            {state.stats && (
              <div className="font-body text-body-sm text-on-surface-variant mb-4">
                {state.stats.total} {state.stats.total === 1 ? 'profil' : 'profili'}
                {' · '}{state.stats.withPhoto} ze zdjęciem
                {' · '}{state.stats.withGallery} z galerią
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Szukaj…"
                className="bg-surface-container border border-outline-variant/30 px-4 py-2 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50"
              />
              <div className="flex gap-4">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors whitespace-nowrap ${
                      mode === m.id ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
                <FinderCard key={p.id} p={p} onOpen={() => setSelectedId(p.id)} />
              ))}
            </div>
            {state.items.length === 0 ? (
              <p className="font-body text-body-md text-on-surface-variant">Brak wyników.</p>
            ) : (
              (() => {
                const totalPages = Math.ceil(state.items.length / PAGE_SIZE)
                if (totalPages <= 1) return null
                return (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                    >
                      ← Poprzednia
                    </button>
                    <span className="font-body text-body-sm text-on-surface-variant">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                    >
                      Następna →
                    </button>
                  </div>
                )
              })()
            )}
          </>
        )}
      </main>
    </div>
  )
}
