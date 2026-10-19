import { api } from '@/shared/api/client.js'
import { supabase } from '../model/supabaseClient.js'

export const meQueryKey = ['auth', 'me']

export async function fetchMe() {
  const { data } = await api.get('/users/me')
  return data
}

export function signInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUpWithPassword({ name, email, password }) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
}
