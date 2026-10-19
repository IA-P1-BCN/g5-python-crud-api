// Axios calls: today's bookings, confirm, start, finish, register result. No React, no mapping.
import { api } from '@/shared/api/client.js'

// `day` (YYYY-MM-DD, UTC day) is empty for today. Always a plain array ordered by slot start,
// cancelled excluded.
export async function fetchTodayBookings(day) {
  if (!day) {
    const { data } = await api.get('/bookings/today')
    return data
  }
  // Another day: the paginated list filtered on that day (staff and admin see everyone's).
  const { data } = await api.get('/bookings', {
    params: { date_from: day, date_to: day, size: 100 },
  })
  return data.items
    .filter((b) => b.status !== 'CANCELLED')
    .sort((a, b) => a.time_slot.starts_at.localeCompare(b.time_slot.starts_at))
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
