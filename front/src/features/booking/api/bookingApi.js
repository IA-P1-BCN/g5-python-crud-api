// Axios calls: slots and create booking. No React, no mapping.
import { api } from '@/shared/api/client.js'
import { SlotTakenError } from '../model/errors'

// Códigos del contrato (BR-X1) que significan que la franja ya no se puede reservar
const SLOT_UNAVAILABLE_CODES = ['SLOT_TAKEN', 'SLOT_NOT_AVAILABLE']

export async function fetchSlots({ roomId, date }) {
  // No `available` filter: the grid also shows taken, blocked and past slots.
  const { data } = await api.get('/time-slots', {
    params: { room_id: roomId, date, size: 100 },
  })
  return data.items
}

export async function createBooking({ slotId, players }) {
  try {
    // BookingCreate requires our users.id, not the Supabase uuid
    const { data: me } = await api.get('/users/me')
    const { data } = await api.post('/bookings', {
      user_id: me.id,
      time_slot_id: slotId,
      players: players || 1,
    })
    return data
  } catch (error) {
    const { status, data } = error.response ?? {}

    if (SLOT_UNAVAILABLE_CODES.includes(data?.code)) {
      throw new SlotTakenError()
    }

    const err = new Error(data?.detail || error.message)
    err.status = status
    err.code = data?.code
    throw err
  }
}
