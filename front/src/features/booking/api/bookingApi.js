import { api } from '@/shared/api/client.js'

export async function fetchSlots({ roomId, date }) {
  const { data } = await api.get('/time-slots', {
    params: { room_id: roomId, date, size: 100 },
  })
  return data.items
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/users/me')
  return data
}

export async function createBooking({ userId, slotId, players }) {
  const { data } = await api.post('/bookings', {
    user_id: userId,
    time_slot_id: slotId,
    players,
  })
  return data
}
