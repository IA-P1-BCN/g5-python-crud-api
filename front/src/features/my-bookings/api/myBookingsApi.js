import { api } from '@/shared/api/client.js'

export async function fetchGameHistory() {
  // Plain array (not paginated), COMPLETED only, most recent first. `result` may be null.
  const { data } = await api.get('/users/me/history')
  return data
}

// Current user as the API knows it. Same call and same query key as the auth feature, so the cache
// is shared; we need the numeric `id` here (the Supabase id of useAuth is a different thing).
export async function fetchCurrentUser() {
  const { data } = await api.get('/users/me')
  return data
}

export async function fetchMyBookings(userId) {
  // Staff and admin get EVERYONE's bookings unless `user_id` is sent (a client is scoped by the API).
  // Size 100 is the API maximum: more than that needs real pagination (not in ticket 074).
  const { data } = await api.get('/bookings', { params: { user_id: userId, size: 100 } })
  return data.items
}

export async function updateBookingPlayers({ id, players }) {
  const { data } = await api.put(`/bookings/${id}`, { players })
  return data
}

export async function updateBookingSlot({ id, timeSlotId }) {
  // The API reads `time_slot_id` (snake_case). The new slot may belong to another room (BR-L5).
  const { data } = await api.put(`/bookings/${id}`, { time_slot_id: timeSlotId })
  return data
}

export async function cancelBooking(id) {
  const { data } = await api.put(`/bookings/${id}/cancel`)
  return data
}
