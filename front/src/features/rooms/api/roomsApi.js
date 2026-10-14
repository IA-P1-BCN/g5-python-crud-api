// Axios calls for rooms (GET /rooms, GET /rooms/:slug). No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchActiveRooms() {
  // The list is paginated: size 100 is the API maximum, enough for the corridor (about 9 doors).
  const { data } = await api.get('/rooms', { params: { status: 'active', size: 100 } })
  return data.items
}
