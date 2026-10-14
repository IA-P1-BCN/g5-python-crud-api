// Axios calls for rooms (GET /rooms, GET /rooms/:slug). No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchActiveRooms() {
  // Paginated list: the default page (20 rooms) is more than the corridor can show (about 9 doors).
  const { data } = await api.get('/rooms', { params: { status: 'active' } })
  return data.items
}
