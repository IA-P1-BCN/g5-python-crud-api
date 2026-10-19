import { api } from '@/shared/api/client.js'

export async function fetchGameHistory() {
  const { data } = await api.get('/users/me/history')
  return data
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/users/me')
  return data
}

export async function fetchMyBookings(userId) {
  const { data } = await api.get('/bookings', { params: { user_id: userId, size: 100 } })
  return data.items
}

export async function updateBookingPlayers({ id, players }) {
  const { data } = await api.put(`/bookings/${id}`, { players })
  return data
}

export async function updateBookingSlot({ id, timeSlotId }) {
  const { data } = await api.put(`/bookings/${id}`, { time_slot_id: timeSlotId })
  return data
}

export async function cancelBooking(id) {
  const { data } = await api.put(`/bookings/${id}/cancel`)
  return data
}
