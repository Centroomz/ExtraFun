import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'
import { loadCardStats } from '../lib/cardStats'

const ADMIN_EMAILS = ['pinksservice@gmail.com', 'kingaa.kaczynska@gmail.com']

// Admin-only: "👁 impressions · ↗ clicks · CTR" for one card (last 30 days).
// Renders nothing for everyone else. `className` positions it inside the card.
export function CardStatBadge({ kind, id, className = '' }) {
  const { user } = useAuth()
  const isAdmin = ADMIN_EMAILS.includes(user?.email)
  const [stat, setStat] = useState(null)
  useEffect(() => {
    if (!isAdmin || id == null) return
    let live = true
    loadCardStats(apiFetch).then(map => { if (live) setStat(map[`${kind}:${id}`] || { imp: 0, clicks: 0 }) })
    return () => { live = false }
  }, [isAdmin, kind, id])
  if (!isAdmin || !stat) return null
  const ctr = stat.imp ? Math.round((stat.clicks / stat.imp) * 1000) / 10 : 0
  return (
    <span className={`inline-flex items-center gap-2 font-body text-label-caps uppercase text-primary-container bg-surface/80 backdrop-blur-sm px-2 py-1 border border-primary-container/30 pointer-events-none ${className}`}>
      👁 {stat.imp} · ↗ {stat.clicks} · {ctr}%
    </span>
  )
}
