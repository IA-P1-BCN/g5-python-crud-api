import { api } from '@/shared/api/client.js'

export const ROOMS_PAGE_SIZE = 20

export const adminRoomsApi = {
  // Paginated: { items, total, page, size } (API_CONTRACT.md).
  async getRooms(page = 1, size = ROOMS_PAGE_SIZE) {
    const { data } = await api.get('/rooms', { params: { page, size } })
    return data
  },

  async createRoom(room) {
    const { data } = await api.post('/rooms', room)
    return data
  },

  async toggleRoomActive(id, active) {
    const action = active ? 'activate' : 'deactivate'
    const { data } = await api.put(`/rooms/${id}/${action}`)
    return data
  },
}
