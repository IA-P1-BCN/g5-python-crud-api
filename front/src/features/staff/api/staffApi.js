import { api } from '@/shared/api/client.js'

export async function fetchBookingsView(view = 'today') {
  if (view === 'today') {
    const { data } = await api.get('/bookings/today')
    return data
  }
  const params = view === 'ALL' ? { size: 100 } : { status: view, size: 100 }
  const { data } = await api.get('/bookings', { params })
  return data.items
    .filter((b) => b.status !== 'CANCELLED')
    .sort((a, b) => a.time_slot.starts_at.localeCompare(b.time_slot.starts_at))
}

export async function confirmBooking(id) {
  const { data } = await api.put(`/bookings/${id}/confirm`)
  return data
}

export async function startGame(id) {
  const { data } = await api.put(`/bookings/${id}/start`)
  return data
}

export async function finishGame(id) {
  const { data } = await api.put(`/bookings/${id}/finish`)
  return data
}

export async function registerResult(id, result) {
  const { data } = await api.post(`/bookings/${id}/result`, result)
  return data
}
