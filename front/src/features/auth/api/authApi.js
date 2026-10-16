// Axios calls for auth/session. No React.
import { api } from '@/shared/api/client.js'

export const meQueryKey = ['auth', 'me']

// Current user as the backend knows it (includes the role).
export async function fetchMe() {
  const { data } = await api.get('/users/me')
  return data
}
