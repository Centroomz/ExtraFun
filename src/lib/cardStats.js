// Card impressions/clicks (article / venue / ad cards, mobile tiles and desktop
// grids alike). Aggregated per day on the server (card_stats) — no IP, no user
// id, no per-session rows. An impression = card ≥50% visible for ≥1s, counted
// once per card per browser session. Events are batched and sent as a beacon.
import { useEffect, useRef } from 'react'

const queue = []
let flushTimer = null
const seen = (() => {
  try { return new Set(JSON.parse(sessionStorage.getItem('ef_card_seen') || '[]')) } catch { return new Set() }
})()

function persistSeen() {
  try { sessionStorage.setItem('ef_card_seen', JSON.stringify([...seen].slice(-2000))) } catch {}
}

function flush() {
  flushTimer = null
  if (!queue.length) return
  const events = queue.splice(0, 40)
  const body = JSON.stringify({ events })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/card-stats', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/card-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
  } catch {}
  if (queue.length) flushTimer = setTimeout(flush, 500)
}

function enqueue(ev) {
  queue.push(ev)
  if (!flushTimer) flushTimer = setTimeout(flush, 4000)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
}

export function trackImpression(kind, id) {
  const key = `${kind}:${id}`
  if (seen.has(key)) return
  seen.add(key); persistSeen()
  enqueue({ kind, id: String(id), ev: 'imp' })
}

export function trackClick(kind, id) {
  enqueue({ kind, id: String(id), ev: 'click' })
  flush() // a click usually navigates away — don't wait for the timer
}

/** Ref hook: attach to a card element; fires one impression when it has been
 *  ≥50% visible for ≥1s. */
export function useImpression(kind, id) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || id == null || typeof IntersectionObserver === 'undefined') return
    let timer = null
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!timer) timer = setTimeout(() => { trackImpression(kind, id); io.disconnect() }, 1000)
      } else if (timer) { clearTimeout(timer); timer = null }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => { if (timer) clearTimeout(timer); io.disconnect() }
  }, [kind, id])
  return ref
}

/* ── Admin read side: one fetch per page load, shared by every badge ── */
let statsPromise = null
export function loadCardStats(apiFetch) {
  if (!statsPromise) statsPromise = apiFetch('/api/admin/card-stats?days=30').then(r => r.stats || {}).catch(() => ({}))
  return statsPromise
}
