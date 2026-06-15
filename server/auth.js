import { supabaseAdmin } from './supabase.js'

const ADMIN_EMAILS = [
  'pinksservice@gmail.com',
  'kingaa.kaczynska@gmail.com',
  ...(process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
]

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function verifyJWT(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = { id: user.id, email: user.email, meta: user.user_metadata }
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

// Attach req.user if a valid token is present, never block.
export async function optionalAuth(req, _res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (token) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) req.user = { id: user.id, email: user.email, meta: user.user_metadata }
    } catch { /* anonymous */ }
  }
  next()
}

export function isAdmin(req, res, next) {
  if (!isAdminEmail(req.user?.email)) return res.status(403).json({ message: 'Brak dostępu' })
  next()
}
