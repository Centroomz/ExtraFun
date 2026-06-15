import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

const TYPE_LABEL = {
  birth: 'Urodziny',
  death: 'Odejście',
  event: 'Wydarzenie',
}

const TYPE_ICON = {
  birth: '🎂',
  death: '🕯️',
  event: '📅',
}

export function CalendarWidget() {
  const [events, setEvents] = useState(null)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const now = new Date()
    const m = now.getMonth() + 1
    const d = now.getDate()
    apiFetch(`/api/calendar?month=${m}&day=${d}`)
      .then(data => { if (Array.isArray(data) && data.length > 0) setEvents(data) })
      .catch(() => {})
  }, [])

  if (!events || events.length === 0) return null

  const ev = events[idx]

  return (
    <div className="mag-sidebar-word" style={{ position: 'relative' }}>
      <div className="mag-sidebar-word-label">
        {TYPE_ICON[ev.type]} Kartka z kalendarza
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {TYPE_LABEL[ev.type]}{ev.year ? ` · ${ev.year}` : ''}
      </div>
      <div className="mag-sidebar-word-term" style={{ marginBottom: 6 }}>{ev.name}</div>
      <div className="mag-sidebar-word-def">{ev.description}</div>
      {events.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setIdx((idx - 1 + events.length) % events.length)}
            style={{ background: 'rgba(0,229,255,0.15)', border: '2px solid rgba(0,229,255,0.6)', borderRadius: 8, padding: '6px 18px', color: '#00E5FF', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}
          >‹</button>
          <span style={{ fontSize: 12, color: '#00E5FF', fontWeight: 700 }}>{idx + 1} / {events.length}</span>
          <button
            onClick={() => setIdx((idx + 1) % events.length)}
            style={{ background: 'rgba(0,229,255,0.15)', border: '2px solid rgba(0,229,255,0.6)', borderRadius: 8, padding: '6px 18px', color: '#00E5FF', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}
          >›</button>
        </div>
      )}
    </div>
  )
}
