import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'https://lvxaycjuhchoqhnttyjj.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) console.error('[server] SUPABASE_SERVICE_ROLE_KEY missing — API will fail')

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
