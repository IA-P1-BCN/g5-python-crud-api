import { api } from '@/shared/api/client.js'

export async function fetchGameHistory() {
  // Plain array (not paginated), COMPLETED only, most recent first. `result` may be null.
  const { data } = await api.get('/users/me/history')
  return data
}

export async function fetchMyBookings() {
  // A client only gets their own bookings (the API scopes it from the JWT).
  // Size 100 is the API maximum: more than that needs real pagination (not in ticket 074).
  const { data } = await api.get('/bookings', { params: { size: 100 } })
  return data.items
}
