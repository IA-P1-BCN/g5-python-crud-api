import { api } from '@/shared/api/client.js'

export async function fetchActiveRooms() {
  const { data } = await api.get('/rooms', { params: { status: 'active' } })
  return data.items
}

export async function fetchRoom(slug) {
  const { data } = await api.get(`/rooms/${slug}`)
  return data
}
