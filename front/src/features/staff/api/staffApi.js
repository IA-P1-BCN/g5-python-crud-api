// Axios calls: the planning list, confirm, start, finish, register result. No React, no mapping.
import { api } from '@/shared/api/client.js'

// `view`: 'today' (default), 'ALL' or a booking status. Always a plain array ordered by slot
// start, cancelled excluded.
export async function fetchBookingsView(view = 'today') {
  if (view === 'today') {
    const { data } = await api.get('/bookings/today')
    return data
  }
  // Any date: the paginated list (staff and admin see everyone's), filtered by status if given.
  const params = view === 'ALL' ? { size: 100 } : { status: view, size: 100 }
  const { data } = await api.get('/bookings', { params })
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
