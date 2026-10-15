// Axios calls: today's bookings, start, finish, register result. No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchTodayBookings() {
  // Plain array (not paginated), already ordered by slot start, cancelled excluded.
  const { data } = await api.get('/bookings/today')
  return data
}
