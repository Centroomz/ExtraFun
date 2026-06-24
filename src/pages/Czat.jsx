import { useState, useEffect, useRef } from 'react'
import { Link } from 'wouter'
import { apiFetch } from '../lib/api'

// Shared live chat — same stream as bizarriusz.pl/czat (so the feed is alive).
// Replaces the old DM/conversations UI for v1.

function MessageBubble({ msg, isMe }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMe ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      padding: '0 16px',
    }}>
      {!isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(233,193,118,0.3), rgba(157,78,221,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end',
        }}>👤</div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isMe
          ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
          : 'rgba(255,255,255,0.08)',
        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.12)',
        color: 'white',
        fontSize: 14,
        lineHeight: 1.5,
      }}>
        {!isMe && (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 2 }}>
            {msg.username || 'Gość'}
          </div>
        )}
        {msg.content}
        <div style={{ fontSize: 10, color: isMe ? 'rgba(232,230,252,0.86)' : 'var(--text-dim)', marginTop: 4 }}>
          {new Date(msg.created_at).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export function Czat({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const load = () => apiFetch('/api/shoutbox').then(setMessages).catch(() => {})

  useEffect(() => {
    load()
    const t = setInterval(load, 6000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending || !user) return
    setSending(true)
    setError('')
    try {
      await apiFetch('/api/shoutbox', { method: 'POST', body: { content } })
      setInput('')
      await load()
    } catch (e) {
      setError(e?.message === '401' ? 'Sesja wygasła — zaloguj się ponownie.' : 'Nie udało się wysłać. Spróbuj ponownie.')
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(233,193,118,0.3), rgba(157,78,221,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💬</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Czat na żywo</div>
          <div className="xenia-badge">Wspólny pokój · online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="czat-messages" style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 80 }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">Cisza w eterze</div>
            <div className="empty-desc">Napisz pierwszy — czat jest wspólny dla całej społeczności.</div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isMe={!!user && msg.user_id === user.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="czat-input-bar" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520, margin: '0 auto',
      }}>
        {error && (
          <div style={{ color: '#ff8a8a', fontSize: 12, textAlign: 'center' }}>{error}</div>
        )}
        {user ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              style={{ flex: 1, padding: '12px 16px' }}
              placeholder="Napisz wiadomość..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button
              className="btn-primary"
              style={{ padding: '12px 18px', minWidth: 0 }}
              onClick={sendMessage}
              disabled={!input.trim() || sending}
            >→</button>
          </div>
        ) : (
          <Link href="/login">
            <button className="btn-primary" style={{ width: '100%', padding: '12px 16px' }}>
              Zaloguj się, aby pisać
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
