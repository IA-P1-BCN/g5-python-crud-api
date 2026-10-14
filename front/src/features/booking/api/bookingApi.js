// Axios calls: slots and create booking. No React, no mapping.
import { api } from '@/shared/api/client'

export async function fetchSlotsForDate({ roomId, date }) {
  const { data } = await api.get('/time-slots', {
    params: {
      room_id: roomId,
      date: date,
      available: true,
    },
  })

  return data.items.map((slot) => ({
    ...slot,
    time: new Date(slot.starts_at).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    state: slot.is_bookable ? 'available' : 'taken', // Ejemplo de mapeo de estado
  }))
}
