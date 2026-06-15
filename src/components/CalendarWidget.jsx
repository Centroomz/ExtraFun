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
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setIdx((idx - 1 + events.length) % events.length)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 10px', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
          >‹</button>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>{idx + 1}/{events.length}</span>
          <button
            onClick={() => setIdx((idx + 1) % events.length)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 10px', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
          >›</button>
        </div>
      )}
    </div>
  )
}
