import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oxzpqpclgfbsklxazkga.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94enBxcGNsZ2Zic2tseGF6a2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTY3MjUsImV4cCI6MjA4MDE3MjcyNX0.b4I8ORtGFAzAZKeVp5ullC-aywVK7Oygnxfy6GFuqdI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
