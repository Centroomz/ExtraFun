import { supabase } from './supabase'

// Single fetch helper for the backend API. Attaches the current Supabase
// session's bearer token so the server can authorize writes.
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.status === 204 ? null : res.json()
}

// Shared in-flight/short-lived cache for public GET lists. On the home page
// Magazyn and SiteRail both requested /api/articles (55 kB, ~1s each on 4G);
// the rail also pulls /api/places. One request per path per 30s instead.
const _shared = new Map()
export function apiFetchShared(path, ttlMs = 30_000) {
  const hit = _shared.get(path)
  if (hit && Date.now() - hit.at < ttlMs) return hit.p
  const p = apiFetch(path).catch(err => { _shared.delete(path); throw err })
  _shared.set(path, { at: Date.now(), p })
  return p
}
