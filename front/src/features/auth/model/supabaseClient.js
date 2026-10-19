import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if ((!url || !key) && import.meta.env.MODE !== 'test') {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in front/.env.local')
}

export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key')
