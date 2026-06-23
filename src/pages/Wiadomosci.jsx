import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { Button } from '../components/nocturne'

export function Wiadomosci({ user }) {
  const [msgs, setMsgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // thread key
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const me = user?.id

  async function load() {
    try { setMsgs((await apiFetch('/api/messages')) || []) } catch { setMsgs([]) }
    setLoading(false)
    apiFetch('/api/messages/read', { method: 'POST' }).catch(() => {})
  }
  useEffect(() => { if (user) load() }, [user])

  if (!user) {
    return (
      <div className="bg-background min-h-screen text-on-surface">
        <main className="max-w-2xl mx-auto px-6 md:px-16 py-24 text-center">
          <p className="font-display italic text-headline-sm text-on-surface">Zaloguj się, aby zobaczyć wiadomości.</p>
        </main>
      </div>
    )
  }

  // Group messages into threads by (ad, partner)
  const threads = {}
  for (const m of msgs) {
    const partner = m.sender_id === me ? m.recipient_id : m.sender_id
    const partnerName = m.sender_id === me ? '' : (m.sender_name || '')
    const key = `${m.ad_id}:${partner}`
    if (!threads[key]) threads[key] = { key, ad_id: m.ad_id, ad_title: m.ad_title, partner, partnerName: '', items: [], unread: 0 }
    const t = threads[key]
    t.items.push(m)
    if (partnerName && !t.partnerName) t.partnerName = partnerName
    if (m.recipient_id === me && !m.is_read) t.unread++
  }
  const list = Object.values(threads).sort(
    (a, b) => new Date(b.items[b.items.length - 1].created_at) - new Date(a.items[a.items.length - 1].created_at)
  )
  const current = list.find(t => t.key === active)

  async function sendReply() {
    if (!reply.trim() || sending || !current) return
    setSending(true)
    try {
      await apiFetch('/api/messages', { method: 'POST', body: { ad_id: current.ad_id, content: reply.trim(), recipient_id: current.partner } })
      setReply(''); await load()
    } catch (e) { alert('Błąd: ' + (e.message || '')) }
    setSending(false)
  }

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet><title>Wiadomości | ExtraFun</title><meta name="robots" content="noindex" /></Helmet>
      <main className="max-w-2xl mx-auto px-6 md:px-16 pt-12 pb-24">
        {current ? (
          /* ── Thread view ── */
          <>
            <button onClick={() => setActive(null)} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Wiadomości</button>
            <h1 className="font-display italic font-semibold text-headline-md text-on-surface mb-1">{current.partnerName || 'Ogłoszeniodawca'}</h1>
            <div className="font-body text-body-md text-on-surface-variant mb-8">{current.ad_title}</div>

            <div className="space-y-4 mb-8">
              {current.items.map(m => {
                const mine = m.sender_id === me
                return (
                  <div key={m.id} className={`max-w-[80%] p-4 ${mine ? 'ml-auto bg-primary-container/15 border border-primary-container/30' : 'bg-surface-container border border-outline-variant/20'}`}>
                    <div className="font-body text-body-md text-on-surface leading-relaxed">{m.content}</div>
                    <div className="font-body text-label-caps uppercase text-outline mt-2">{new Date(m.created_at).toLocaleString('pl', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3">
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Odpowiedz…"
                className="w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50 min-h-[90px]" />
              <div><Button onClick={sendReply} disabled={!reply.trim() || sending}>{sending ? 'Wysyłam…' : 'Wyślij'}</Button></div>
            </div>
          </>
        ) : (
          /* ── Inbox list ── */
          <>
            <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface mb-2 leading-none">Wiadomości</h1>
            <p className="font-body text-body-md text-on-surface-variant mb-10">Prywatne rozmowy z ogłoszeniodawcami</p>

            {loading ? (
              <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
            ) : list.length === 0 ? (
              <div className="py-24 text-center">
                <div className="font-display italic text-headline-sm text-on-surface mb-2">Brak wiadomości</div>
                <div className="font-body text-body-md text-on-surface-variant">Napisz do ogłoszeniodawcy z poziomu ogłoszenia.</div>
              </div>
            ) : (
              <div>
                {list.map(t => {
                  const last = t.items[t.items.length - 1]
                  return (
                    <div key={t.key} onClick={() => setActive(t.key)} className="group py-5 border-b border-outline-variant/15 cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-display italic font-medium text-body-lg text-on-surface group-hover:text-primary-container transition-colors">
                          {t.partnerName || 'Ogłoszeniodawca'}
                          {t.unread > 0 && <span className="ml-2 align-middle inline-block w-2 h-2 rounded-full bg-primary-container" />}
                        </div>
                        <span className="font-body text-label-caps uppercase text-outline flex-shrink-0">{new Date(last.created_at).toLocaleDateString('pl')}</span>
                      </div>
                      <div className="font-body text-label-caps uppercase text-primary-container mt-1">{t.ad_title}</div>
                      <div className="font-body text-body-md text-on-surface-variant mt-1 line-clamp-1">{last.sender_id === me ? 'Ty: ' : ''}{last.content}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
