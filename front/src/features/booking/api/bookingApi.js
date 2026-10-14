// Axios calls: slots and create booking. No React, no mapping.
export async function fetchSlotsForDate({ roomId, date }) {
  const response = await fetch(`/api/rooms/${roomId}/slots?date=${date}`)
  if (!response.ok) {
    throw new Error('Error fetching slots')
  }
  return response.json()
}
