import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const MAX = 1000

export function ArticleComments({ articleId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | error
  const [errorMsg, setErrorMsg] = useState('')

  // Re-fetch when login state changes: logged-out visitors get initials only.
  useEffect(() => {
    if (!articleId) return
    let alive = true
    apiFetch(`/api/articles/${articleId}/comments`)
      .then(list => { if (alive) setComments(list || []) })
      .catch(() => { if (alive) setComments([]) })
    return () => { alive = false }
  }, [articleId, user?.id])

  async function submit() {
    const content = text.trim()
    if (!content || status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    try {
      const c = await apiFetch(`/api/articles/${articleId}/comments`, { method: 'POST', body: { content } })
      setComments(prev => [...prev, c])
      setText('')
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err.message === '400' ? 'Komentarz musi mieć 1–1000 znaków i nie może zawierać linków.'
        : err.message === '429' ? 'Za szybko, spróbuj za chwilę.'
        : 'Nie udało się dodać komentarza.'
      )
    }
  }

  async function remove(id) {
    if (!window.confirm('Usunąć komentarz?')) return
    try {
      await apiFetch(`/api/articles/comments/${id}`, { method: 'DELETE' })
      setComments(prev => prev.filter(c => c.id !== id))
    } catch { /* keep the comment visible */ }
  }

  const inputClass = "w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50 min-h-[96px]"

  return (
    <section className="mt-16" aria-labelledby="ef-comments-h">
      <h2 id="ef-comments-h" className="font-display italic font-medium text-headline-md text-on-surface border-b border-outline-variant/20 pb-4 mb-8">
        Komentarze{comments.length > 0 && <span className="text-outline"> ({comments.length})</span>}
      </h2>

      {comments.length === 0 && (
        <p className="font-body text-body-md text-on-surface-variant mb-8">Nikt jeszcze nie skomentował. Możesz być pierwszy.</p>
      )}

      <ul className="space-y-6 mb-10">
        {comments.map(c => (
          <li key={c.id} className="border-b border-outline-variant/20 pb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-body text-label-caps uppercase text-primary-container">{c.username}</span>
              <span className="font-body text-label-caps uppercase text-outline">
                {new Date(c.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {c.canDelete && (
                <button onClick={() => remove(c.id)} className="ml-auto font-body text-label-caps uppercase text-outline hover:text-primary-container cursor-pointer">
                  Usuń
                </button>
              )}
            </div>
            <p className="font-body text-body-md text-on-surface whitespace-pre-wrap break-words">{c.content}</p>
          </li>
        ))}
      </ul>

      {user ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={MAX}
            placeholder="Napisz komentarz…"
            aria-label="Komentarz"
            className={inputClass}
          />
          {status === 'error' && <p className="font-body text-body-md text-red-400">{errorMsg}</p>}
          <div className="flex items-center gap-4">
            <button className="btn-primary" onClick={submit} disabled={!text.trim() || status === 'sending'}>
              {status === 'sending' ? 'Wysyłanie…' : 'Dodaj komentarz'}
            </button>
            <span className="font-body text-label-caps uppercase text-outline">{text.length}/{MAX}</span>
          </div>
        </div>
      ) : (
        <Link href="/login">
          <button className="btn-primary">Zaloguj się, aby komentować</button>
        </Link>
      )}
    </section>
  )
}
