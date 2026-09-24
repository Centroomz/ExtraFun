import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { Button } from '../components/nocturne'
import { useAuth } from '../hooks/useAuth'

const MODES = [
  { id: 'all', label: 'Wszyscy' },
  { id: 'photos', label: 'Ze zdjęciem' },
  { id: 'new', label: 'Nowi' },
  { id: 'active', label: 'Aktywni' },
]

function FinderAvatar({ url, name }) {
  const [ok, setOk] = useState(!!url)
  return url && ok
    ? <img src={url} alt="" onError={() => setOk(false)} className="w-full aspect-square object-cover" />
    : (
      <div className="w-full aspect-square bg-surface-container flex items-center justify-center text-on-surface-variant font-display text-display-sm-mobile">
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
}

function FinderCard({ p }) {
  return (
    <div className="border border-outline-variant/20 bg-surface-container-low">
      <FinderAvatar url={p.avatarUrl} name={p.displayName} />
      <div className="p-3">
        <div className="font-body font-semibold text-body-md text-on-surface">
          {p.displayName}{p.age ? `, ${p.age}` : ''}
        </div>
        {p.lookingFor && (
          <div className="font-body text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{p.lookingFor}</div>
        )}
      </div>
    </div>
  )
}

// Phase 1 — read-only. Backend keeps FINDER_LIVE=false until the Phase-3 consent
// broadcast, so everyone (guest and logged-in) gets {count, locked:true} — real
// rows never leave the server. The grid/filters below are wired and ready for
// when Phase 3 flips the gate; until then this always renders the locked state.
export function Finder({ user }) {
  const { profile } = useAuth()
  const [state, setState] = useState({ loading: true, locked: true, count: 0, items: [] })
  const [mode, setMode] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    setState(s => ({ ...s, loading: true }))
    const params = new URLSearchParams({ mode })
    if (q.trim()) params.set('q', q.trim())
    apiFetch(`/api/finder?${params}`)
      .then(d => { if (alive) setState({ loading: false, locked: !!d.locked, count: d.count || 0, items: d.items || [] }) })
      .catch(() => { if (alive) setState(s => ({ ...s, loading: false })) })
    return () => { alive = false }
  }, [mode, q])

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
              {state.items.map(p => <FinderCard key={p.id} p={p} />)}
            </div>
            {state.items.length === 0 && (
              <p className="font-body text-body-md text-on-surface-variant">Brak wyników.</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
