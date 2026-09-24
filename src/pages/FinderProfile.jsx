import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { apiFetch } from '../lib/api'
import { Button } from '../components/nocturne'

export function FinderProfile({ id, onBack, onBlocked }) {
  const [, navigate] = useLocation()
  const [p, setP] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => apiFetch(`/api/finder/${id}`)
    .then(setP)
    .catch(() => setNotFound(true))

  useEffect(() => { load() }, [id])

  const like = async () => {
    if (busy) return
    setBusy(true)
    try { await apiFetch(`/api/finder/${id}/like`, { method: 'POST' }); await load() }
    catch (e) { alert('Nie udało się: ' + (e.message || '')) }
    setBusy(false)
  }

  const block = async () => {
    if (busy || !confirm('Zablokować tę osobę? Nie zobaczycie się nawzajem.')) return
    setBusy(true)
    try { await apiFetch(`/api/finder/${id}/block`, { method: 'POST' }); onBlocked?.() }
    catch (e) { alert('Nie udało się: ' + (e.message || '')); setBusy(false) }
  }

  const report = async () => {
    if (busy) return
    const reason = prompt('Powód zgłoszenia (opcjonalnie):') || ''
    setBusy(true)
    try { await apiFetch(`/api/finder/${id}/report`, { method: 'POST', body: { reason } }); alert('Zgłoszono. Dziękujemy.') }
    catch (e) { alert('Nie udało się: ' + (e.message || '')) }
    setBusy(false)
  }

  if (notFound) {
    return (
      <div className="bg-background min-h-screen text-on-surface">
        <main className="max-w-2xl mx-auto px-6 md:px-16 pt-12 pb-24">
          <button onClick={onBack} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Szukaj</button>
          <p className="font-body text-body-md text-on-surface-variant">Nie znaleziono profilu.</p>
        </main>
      </div>
    )
  }
  if (!p) return null

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <main className="max-w-2xl mx-auto px-6 md:px-16 pt-12 pb-24">
        <button onClick={onBack} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Szukaj</button>

        <div className="flex items-center gap-4 mb-6">
          {p.avatarUrl
            ? <img src={p.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
            : <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-display text-display-sm-mobile shrink-0">{p.displayName?.[0]?.toUpperCase() || '?'}</div>}
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-display-sm-mobile text-on-surface leading-tight">
              {p.displayName}{p.age ? `, ${p.age}` : ''}
            </h1>
            {p.isMatch && <span className="font-body text-body-sm text-primary-container">💞 Macie match</span>}
          </div>
        </div>

        {p.lookingFor && (
          <p className="font-body text-body-md text-on-surface-variant mb-4"><span className="text-primary-container">Szuka:</span> {p.lookingFor}</p>
        )}
        {p.about && <p className="font-body text-body-md text-on-surface leading-relaxed whitespace-pre-line mb-6">{p.about}</p>}

        {p.prompts?.length > 0 && (
          <div className="space-y-4 mb-6">
            {p.prompts.map((pr, i) => (
              <div key={i} className="border border-outline-variant/20 p-4">
                <div className="font-body text-label-caps uppercase text-primary-container mb-1">{pr.q}</div>
                <div className="font-body text-body-md text-on-surface">{pr.a}</div>
              </div>
            ))}
          </div>
        )}

        {p.gallery?.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {p.gallery.map((u, i) => <img key={i} src={u} alt="" loading="lazy" className="aspect-square object-cover" />)}
          </div>
        )}

        <div className="flex items-center gap-6">
          <Button onClick={() => navigate(`/wiadomosci?to=${id}&name=${encodeURIComponent(p.displayName)}`)}>Napisz</Button>
          <Button onClick={like} disabled={busy}>{p.likedByMe ? '💔 Cofnij polubienie' : '❤️ Lubię'}</Button>
          <button onClick={block} disabled={busy} className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface">Zablokuj</button>
          <button onClick={report} disabled={busy} className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface">Zgłoś</button>
        </div>
      </main>
    </div>
  )
}
