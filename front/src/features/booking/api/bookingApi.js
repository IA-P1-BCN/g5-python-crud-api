// Axios calls: slots and create booking. No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchSlots({ roomId, date }) {
  // No `available` filter: the grid also shows taken, blocked and past slots.
  const { data } = await api.get('/time-slots', {
    params: { room_id: roomId, date, size: 100 },
  })
  return data.items
}

// Same call as the auth feature: the result is stored under its `meQueryKey`.
export async function fetchCurrentUser() {
  const { data } = await api.get('/users/me')
  return data
}

// `userId` is our users.id (BookingCreate.user_id), not the Supabase uuid.
export async function createBooking({ userId, slotId, players }) {
  const { data } = await api.post('/bookings', {
    user_id: userId,
    time_slot_id: slotId,
    players,
  })
  return data
}
