// Single Supabase client instance (Google login). The session is persisted by supabase-js itself.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if ((!url || !key) && import.meta.env.MODE !== 'test') {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in front/.env.local')
}

// Fallbacks only avoid a crash at import time (tests, CI); login will not work without real values.
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key')
