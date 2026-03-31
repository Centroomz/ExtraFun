import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const XENIA_ID = 'xenia-bot'
const XENIA_AVATAR = '🤖'
const XENIA_NAME = 'Xenia – AI Asystentka'

const XENIA_RESPONSES = [
  "Cześć! Jestem Xenia, Twoja AI asystentka na ExtraFun. Mogę pomóc Ci zrozumieć terminy CNM, znaleźć miejsca lub odpowiedzieć na pytania o społeczność. O czym chcesz porozmawiać? 💙",
  "To świetne pytanie! W świecie CNM kluczowa jest komunikacja i wzajemna zgoda. Czy chcesz wiedzieć więcej o konkretnym aspekcie?",
  "Rozumiem Twoje wątpliwości. Każda droga jest inna – nie ma jednego 'właściwego' sposobu na relacje. Najważniejsze to autentyczność i szacunek.",
  "Compersion to piękne uczucie, prawda? 💜 To umiejętność, którą można rozwijać. Zacznij od małych kroków i daj sobie czas.",
  "Polecam zajrzeć do sekcji Magazyn – mamy tam artykuły na ten temat! A jeśli masz pytanie do społeczności, Forum jest świetnym miejscem.",
  "Bezpieczeństwo jest zawsze priorytetem. Warto pamiętać o zasadzie SSC: Safe, Sane, Consensual.",
  "Nie jesteś sam/a! Społeczność ExtraFun jest tutaj, żeby się wspierać. Spróbuj zapoznać się na Forum – ludzie są naprawdę życzliwi.",
  "To normalne czuć mieszane emocje na początku. NRE – New Relationship Energy – może być przytłaczające. Daj sobie czas.",
  "Świetnie, że pytasz! Edukacja to klucz. Polecam zacząć od sekcji 'CNM 101' w Magazynie.",
]

let xeniaResponseIndex = 0
function getXeniaResponse() {
  const resp = XENIA_RESPONSES[xeniaResponseIndex % XENIA_RESPONSES.length]
  xeniaResponseIndex++
  return resp
}

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
          background: 'linear-gradient(135deg, rgba(0,229,255,0.3), rgba(157,78,221,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end'
        }}>
          {msg.senderEmoji || '👤'}
        </div>
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
        {msg.content}
        <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-dim)', marginTop: 4 }}>
          {new Date(msg.created_at).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function ChatWindow({ conversationId, partnerName, partnerEmoji, onBack, userId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const isXenia = conversationId === XENIA_ID

  useEffect(() => {
    if (isXenia) {
      setMessages([{
        id: 'welcome',
        content: XENIA_RESPONSES[0],
        sender_id: XENIA_ID,
        senderEmoji: XENIA_AVATAR,
        created_at: new Date().toISOString(),
      }])
    } else {
      loadMessages()
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()
      return () => supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at')
    if (data) setMessages(data)
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')

    if (isXenia) {
      const userMsg = {
        id: Date.now(),
        content,
        sender_id: userId,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMsg])
      setSending(true)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          content: getXeniaResponse(),
          sender_id: XENIA_ID,
          senderEmoji: XENIA_AVATAR,
          created_at: new Date().toISOString(),
        }])
        setSending(false)
      }, 800 + Math.random() * 600)
    } else {
      setSending(true)
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}
        >
          ←
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0,229,255,0.3), rgba(157,78,221,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
        }}>
          {partnerEmoji}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{partnerName}</div>
          {isXenia && <div className="xenia-badge">AI · Zawsze online</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 80 }}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.sender_id === userId && msg.sender_id !== XENIA_ID}
          />
        ))}
        {sending && (
          <div style={{ display: 'flex', padding: '4px 16px', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {partnerEmoji}
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', fontSize: 18 }}>
              <span style={{ animation: 'pulse 1s infinite' }}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto'
      }}>
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
        >
          →
        </button>
      </div>
    </div>
  )
}

export function Czat({ user }) {
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [loading, setLoading] = useState(true)

  const XENIA_CONV = {
    id: XENIA_ID,
    partnerName: XENIA_NAME,
    partnerEmoji: XENIA_AVATAR,
    lastMessage: 'Cześć! Jak mogę Ci pomóc? 💙',
    isXenia: true,
  }

  useEffect(() => {
    if (user) loadConversations()
    else setLoading(false)
  }, [user])

  async function loadConversations() {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .order('last_message_at', { ascending: false })
      setConversations(data || [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  if (activeConv) {
    return (
      <ChatWindow
        conversationId={activeConv.id}
        partnerName={activeConv.partnerName}
        partnerEmoji={activeConv.partnerEmoji}
        onBack={() => setActiveConv(null)}
        userId={user?.id || 'guest'}
      />
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>💬 Czat</h1>
      </div>

      <div className="chat-list">
        {/* Xenia always first */}
        <div className="chat-item" onClick={() => setActiveConv(XENIA_CONV)}>
          <div className="chat-avatar" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.3), rgba(157,78,221,0.3))' }}>
            {XENIA_AVATAR}
          </div>
          <div className="chat-info">
            <div className="chat-name">
              {XENIA_NAME}
              <span className="xenia-badge" style={{ marginLeft: 8 }}>AI</span>
            </div>
            <div className="chat-preview">Cześć! Jak mogę Ci pomóc? 💙</div>
          </div>
          <div className="chat-meta">Teraz</div>
        </div>

        {!user ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">Zaloguj się</div>
            <div className="empty-desc">Aby pisać do innych użytkowników, musisz być zalogowany/a.</div>
          </div>
        ) : loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✉️</div>
            <div className="empty-title">Brak wiadomości</div>
            <div className="empty-desc">Twoje prywatne rozmowy pojawią się tutaj.</div>
          </div>
        ) : (
          conversations.map(conv => (
            <div key={conv.id} className="chat-item" onClick={() => setActiveConv({
              ...conv,
              partnerName: 'Użytkownik',
              partnerEmoji: '👤'
            })}>
              <div className="chat-avatar" style={{ background: 'var(--glass)' }}>👤</div>
              <div className="chat-info">
                <div className="chat-name">Rozmowa</div>
                <div className="chat-preview">Ostatnia wiadomość</div>
              </div>
              <div className="chat-meta">
                {new Date(conv.last_message_at).toLocaleDateString('pl', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
