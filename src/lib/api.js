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
