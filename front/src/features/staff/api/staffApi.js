// Axios calls: today's bookings, confirm, start, finish, register result. No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchTodayBookings() {
  // Plain array (not paginated), already ordered by slot start, cancelled excluded.
  const { data } = await api.get('/bookings/today')
  return data
}

// PENDING -> CONFIRMED
export async function confirmBooking(id) {
  const { data } = await api.put(`/bookings/${id}/confirm`)
  return data
}

// CONFIRMED -> IN_PROGRESS (only on the day of the slot, BR-G3)
export async function startGame(id) {
  const { data } = await api.put(`/bookings/${id}/start`)
  return data
}

// IN_PROGRESS -> COMPLETED
export async function finishGame(id) {
  const { data } = await api.put(`/bookings/${id}/finish`)
  return data
}

// Only once and only when COMPLETED (BR-G4). Body: { completed, completion_time } in seconds.
export async function registerResult(id, result) {
  const { data } = await api.post(`/bookings/${id}/result`, result)
  return data
}
