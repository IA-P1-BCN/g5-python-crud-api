import { api } from '@/shared/api/client.js'

export async function fetchGameHistory() {
  // Plain array (not paginated), COMPLETED only, most recent first. `result` may be null.
  const { data } = await api.get('/users/me/history')
  return data
}
