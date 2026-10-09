// Axios calls for rooms (GET /rooms, GET /rooms/:slug). No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchActiveRooms() {
  const { data } = await api.get('/rooms', { params: { status: 'active' } })
  return data
}
