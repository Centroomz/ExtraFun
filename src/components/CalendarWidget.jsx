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

  const now = new Date()
  const dateStr = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })

  return (
    <div className="mag-sidebar-word" style={{ position: 'relative' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cyan)', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 8 }}>
        📅 {dateStr}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#e5e5e5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {TYPE_ICON[ev.type]} {TYPE_LABEL[ev.type]}{ev.year ? <span style={{ color: 'var(--cyan)' }}> · {ev.year}</span> : ''}
      </div>
      <div className="mag-sidebar-word-term" style={{ marginBottom: 6 }}>{ev.name}</div>
      <div className="mag-sidebar-word-def">{ev.description}</div>
      {events.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setIdx((idx - 1 + events.length) % events.length)}
            style={{ background: 'rgba(233,193,118,0.15)', border: '2px solid rgba(233,193,118,0.6)', borderRadius: 8, padding: '6px 18px', color: '#d4af37', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}
          >‹</button>
          <span style={{ fontSize: 12, color: '#d4af37', fontWeight: 700 }}>{idx + 1} / {events.length}</span>
          <button
            onClick={() => setIdx((idx + 1) % events.length)}
            style={{ background: 'rgba(233,193,118,0.15)', border: '2px solid rgba(233,193,118,0.6)', borderRadius: 8, padding: '6px 18px', color: '#d4af37', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}
          >›</button>
        </div>
      )}
    </div>
  )
}
