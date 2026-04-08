import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lvxaycjuhchoqhnttyjj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_eHi0JKQO03lOIeBnISOKFw_qYpq2Tr0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
