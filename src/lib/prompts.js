// "Iskierki" — profile prompts. Answers live in Supabase auth user_metadata.prompts,
// same store as about/looking_for, shared across portals. Ported 1:1 from
// bizarriusz/shared/prompts.ts (same catalog ids/questions) so a prompt answered
// on one portal reads correctly on the other — the whitelist here MUST match biz's.
export const MAX_PROMPTS = 3
export const PROMPT_ANSWER_MAX = 160

export const PROMPT_CATALOG = [
  { id: 'biz_why', q: 'Do Bizarriusz przychodzę po…' },
  { id: 'know_me', q: 'Najlepiej poznać mnie przy…' },
  { id: 'green_flag', q: 'Zielona flaga u mnie to…' },
  { id: 'ice_breaker', q: 'Zaczep mnie pisząc o…' },
  { id: 'perfect_night', q: 'Idealny wieczór wygląda tak…' },
  { id: 'make_me_laugh', q: 'Rozśmieszysz mnie, jeśli…' },
  { id: 'song', q: 'Piosenka, która zawsze mnie rusza…' },
  { id: 'talent', q: 'Mój nietypowy talent…' },
  { id: 'first_notice', q: 'Pierwsze, co zauważam u kogoś…' },
  { id: 'looking_here', q: 'Tak naprawdę szukam tu…' },
  { id: 'safe_when', q: 'Czuję się swobodnie, kiedy…' },
  { id: 'unwind', q: 'Po ciężkim tygodniu ładuję się…' },
]

const CATALOG_QS = new Set(PROMPT_CATALOG.map(p => p.q))

export function sanitizePrompts(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  const seen = new Set()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const q = String(item.q || '').trim()
    const a = String(item.a || '').trim()
    if (!q || !a || !CATALOG_QS.has(q) || seen.has(q)) continue
    seen.add(q)
    out.push({ q, a: a.slice(0, PROMPT_ANSWER_MAX) })
    if (out.length >= MAX_PROMPTS) break
  }
  return out
}
