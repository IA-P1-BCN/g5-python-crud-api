// Axios calls: slots and create booking. No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchSlots({ roomId, date }) {
  // No `available` filter: the grid also shows taken, blocked and past slots.
  const { data } = await api.get('/time-slots', {
    params: { room_id: roomId, date, size: 100 },
  })
  return data.items
}
