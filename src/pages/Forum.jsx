import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = [
  { id: 'cnm', label: 'CNM & Polyamory', emoji: '💜', color: '#9D4EDD', bg: 'rgba(157,78,221,0.12)' },
  { id: 'swinging', label: 'Swinging', emoji: '🔄', color: '#00E5FF', bg: 'rgba(0,229,255,0.12)' },
  { id: 'bdsm', label: 'BDSM & Fetish', emoji: '⛓️', color: '#FF0080', bg: 'rgba(255,0,128,0.12)' },
  { id: 'newbie', label: 'Kącik Nowicjusza', emoji: '🌱', color: '#00FF96', bg: 'rgba(0,255,150,0.12)' },
  { id: 'clubs', label: 'Kluby i Wydarzenia', emoji: '🏛️', color: '#FFA500', bg: 'rgba(255,165,0,0.12)' },
  { id: 'kawiarnia', label: 'Kawiarenka', emoji: '☕', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Najnowsze' },
  { id: 'popular', label: 'Popularne' },
  { id: 'unanswered', label: 'Bez odpowiedzi' },
]

const DEMO_THREADS = [
  { id: '1', category: 'cnm', title: 'Jak wyjaśnić poliamorię rodzinie bez powodowania paniki?', author_name: 'Marta_K', author_emoji: '🌸', upvotes: 42, reply_count: 17, created_at: new Date(Date.now() - 2*3600000).toISOString(), sticky: false, city: 'Warszawa' },
  { id: '2', category: 'swinging', title: 'Pierwsze wyjście do klubu – co powinniśmy wiedzieć?', author_name: 'Para_WRO', author_emoji: '💑', upvotes: 38, reply_count: 24, created_at: new Date(Date.now() - 5*3600000).toISOString(), sticky: false, city: 'Wrocław' },
  { id: '3', category: 'newbie', title: '📌 Witamy nowicjuszy! Przeczytaj zanim zadasz pytanie', author_name: 'Moderator', author_emoji: '🛡️', upvotes: 156, reply_count: 89, created_at: new Date(Date.now() - 30*24*3600000).toISOString(), sticky: true, city: null },
  { id: '4', category: 'bdsm', title: 'Polecane safewords – co sprawdziło się u Was?', author_name: 'Dom_Krzysztof', author_emoji: '⚡', upvotes: 29, reply_count: 31, created_at: new Date(Date.now() - 8*3600000).toISOString(), sticky: false, city: 'Kraków' },
  { id: '5', category: 'cnm', title: 'Zazdrość vs. compersion – jak to u Was wygląda na początku?', author_name: 'Zosia_PLY', author_emoji: '🌻', upvotes: 67, reply_count: 45, created_at: new Date(Date.now() - 1*3600000).toISOString(), sticky: false, city: 'Gdańsk' },
  { id: '6', category: 'kawiarnia', title: 'Off-topic: jaką literaturę polecacie o CNM?', author_name: 'Bookworm_86', author_emoji: '📚', upvotes: 19, reply_count: 12, created_at: new Date(Date.now() - 12*3600000).toISOString(), sticky: false, city: null },
  { id: '7', category: 'clubs', title: 'Enigma Warszawa – recenzja po ostatniej imprezie', author_name: 'NightOwl_WAW', author_emoji: '🦉', upvotes: 51, reply_count: 28, created_at: new Date(Date.now() - 3*3600000).toISOString(), sticky: false, city: 'Warszawa' },
]

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} min temu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.floor(hours / 24)
  return `${days} dni temu`
}

function ThreadView({ thread, onBack, user }) {
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const cat = CATEGORIES.find(c => c.id === thread.category) || CATEGORIES[0]

  useEffect(() => {
    loadReplies()
    const channel = supabase
      .channel(`thread:${thread.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'forum_replies',
        filter: `thread_id=eq.${thread.id}`
      }, (payload) => setReplies(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [thread.id])

  async function loadReplies() {
    try {
      const { data } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at')
      setReplies(data || [])
    } catch {
      setReplies([])
    } finally {
      setLoading(false)
    }
  }

  async function submitReply() {
    if (!newReply.trim() || !user || submitting) return
    setSubmitting(true)
    try {
      await supabase.from('forum_replies').insert({
        thread_id: thread.id,
        author_id: user.id,
        content: newReply.trim(),
        upvotes: 0,
      })
      setNewReply('')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 22, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Forum</h1>
      </div>
      <div style={{ padding: 16 }}>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: cat.bg, color: cat.color, marginBottom: 10 }}>
          {cat.emoji} {cat.label}
        </span>
        <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 12 }}>{thread.title}</h2>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
          <span>{thread.author_emoji} {thread.author_name}</span>
          <span>👍 {thread.upvotes}</span>
          <span>{formatTimeAgo(thread.created_at)}</span>
        </div>
        {thread.content && (
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>{thread.content}</p>
        )}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>
            {replies.length} {replies.length === 1 ? 'odpowiedź' : 'odpowiedzi'}
          </span>
        </div>
        {loading ? (
          <div className="spinner" style={{ margin: '24px auto' }} />
        ) : replies.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">💭</div>
            <div className="empty-desc">Bądź pierwszą osobą, która odpowie!</div>
          </div>
        ) : (
          replies.map(reply => (
            <div key={reply.id} style={{ marginBottom: 12, padding: 14, background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 14 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>👤 Użytkownik</span>
                <span>{formatTimeAgo(reply.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{reply.content}</p>
            </div>
          ))
        )}
        {user ? (
          <div style={{ marginTop: 16 }}>
            <textarea
              className="form-input"
              style={{ minHeight: 80, marginBottom: 10 }}
              placeholder="Twoja odpowiedź..."
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
            />
            <button className="btn-primary" style={{ width: '100%' }} onClick={submitReply} disabled={!newReply.trim() || submitting}>
              {submitting ? 'Wysyłam...' : 'Odpowiedz →'}
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 16, textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>Zaloguj się, aby odpowiadać</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function Forum({ user }) {
  const [threads, setThreads] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState(null)
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'cnm' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadThreads()
    const channel = supabase
      .channel('forum_threads')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'forum_threads'
      }, (payload) => setThreads(prev => [payload.new, ...prev]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadThreads() {
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error || !data || data.length === 0) {
        setThreads(DEMO_THREADS)
      } else {
        setThreads(data)
      }
    } catch {
      setThreads(DEMO_THREADS)
    } finally {
      setLoading(false)
    }
  }

  async function submitThread() {
    if (!newThread.title.trim() || !user || submitting) return
    setSubmitting(true)
    try {
      await supabase.from('forum_threads').insert({
        ...newThread,
        author_id: user.id,
        upvotes: 0,
        sticky: false,
      })
      setNewThread({ title: '', content: '', category: 'cnm' })
      setShowNewThread(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedThread) {
    return <ThreadView thread={selectedThread} onBack={() => setSelectedThread(null)} user={user} />
  }

  let filtered = activeCategory === 'all' ? threads : threads.filter(t => t.category === activeCategory)
  const sticky = filtered.filter(t => t.sticky)
  const normal = filtered.filter(t => !t.sticky)

  let sorted = [...normal]
  if (sortBy === 'popular') sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
  else if (sortBy === 'unanswered') sorted = sorted.filter(t => (t.reply_count || 0) === 0)
  const finalThreads = [...sticky, ...sorted]

  return (
    <div>
      <div className="page-header">
        <h1>💭 Forum</h1>
      </div>

      {/* Category filter */}
      <div className="category-filter">
        <button
          className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          Wszystkie
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflow: 'auto' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: sortBy === opt.id ? 'rgba(0,229,255,0.12)' : 'transparent',
              border: sortBy === opt.id ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--glass-border)',
              color: sortBy === opt.id ? 'var(--cyan)' : 'var(--text-dim)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div className="forum-list">
          {finalThreads.map(thread => {
            const cat = CATEGORIES.find(c => c.id === thread.category) || CATEGORIES[0]
            return (
              <div key={thread.id} className="forum-thread" onClick={() => setSelectedThread(thread)}>
                {thread.sticky && (
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, marginBottom: 6 }}>📌 Przypięty</div>
                )}
                <div className="forum-thread-header">
                  <span className="forum-category-badge" style={{ background: cat.bg, color: cat.color }}>
                    {cat.emoji} {cat.label}
                  </span>
                  {thread.city && (
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>📍 {thread.city}</span>
                  )}
                </div>
                <div className="forum-thread-title">{thread.title}</div>
                <div className="forum-thread-meta">
                  <span>{thread.author_emoji || '👤'} {thread.author_name || 'Użytkownik'}</span>
                  <span>{formatTimeAgo(thread.created_at)}</span>
                </div>
                <div className="forum-stats">
                  <span>👍 {thread.upvotes || 0}</span>
                  <span>💬 {thread.reply_count || 0}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {user && (
        <button className="fab" onClick={() => setShowNewThread(true)}>+</button>
      )}

      {/* New thread sheet */}
      {showNewThread && (
        <div className="form-sheet">
          <div className="form-sheet-bg" onClick={() => setShowNewThread(false)} />
          <div className="form-sheet-card">
            <div className="form-sheet-title">Nowy temat</div>
            <div className="form-group">
              <label className="form-label">Kategoria</label>
              <select
                className="form-input"
                value={newThread.category}
                onChange={e => setNewThread(prev => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input
                className="form-input"
                placeholder="Tytuł wątku..."
                value={newThread.title}
                onChange={e => setNewThread(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Treść (opcjonalnie)</label>
              <textarea
                className="form-input"
                placeholder="Opisz swój wątek..."
                value={newThread.content}
                onChange={e => setNewThread(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={submitThread} disabled={!newThread.title.trim() || submitting}>
              {submitting ? 'Publikuję...' : 'Opublikuj temat →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
