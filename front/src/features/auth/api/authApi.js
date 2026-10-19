// Axios calls for auth/session. No React.
import { api } from '@/shared/api/client.js'
import { supabase } from '../model/supabaseClient.js'

export const meQueryKey = ['auth', 'me']

// Current user as the backend knows it (includes the role).
export async function fetchMe() {
  const { data } = await api.get('/users/me')
  return data
}

// Email + password sign-in against Supabase. Resolves { data, error }, like the Supabase client.
export function signInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Sign-up with email + password. `name` goes to the user metadata (user_metadata.full_name), which
// AuthProvider exposes as user.name. The API creates the users row on the first authenticated call.
export function signUpWithPassword({ name, email, password }) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
}
