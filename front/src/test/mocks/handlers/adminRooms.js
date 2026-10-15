import { http, HttpResponse } from 'msw'

const rooms = [
  { id: '1', slug: 'room-one', name: 'Room One', genre: 'Terror', duration: 60, base_price: 50, capacity: 6, min_players: 2, difficulty: 4, hook: 'Hook 1', story: 'Story 1', audience: 'Adults', is_active: true },
]

export const adminRoomsHandlers = [
  http.get('/api/v1/rooms', () => {
    return HttpResponse.json({ items: rooms, total: rooms.length, page: 1, size: 20 })
  }),
  http.post('/api/v1/rooms', async ({ request }) => {
    const body = await request.json()
    if (body.slug === 'duplicate-slug') {
      return HttpResponse.json({ detail: 'Duplicate slug', code: 'DUPLICATE' }, { status: 409 })
    }
    const created = { id: String(rooms.length + 1), ...body, is_active: false }
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('/api/v1/rooms/:id/activate', ({ params }) => {
    const room = rooms.find((r) => r.id === params.id)
    if (room) room.is_active = true
    return HttpResponse.json(room)
  }),
  http.put('/api/v1/rooms/:id/deactivate', ({ params }) => {
    const room = rooms.find((r) => r.id === params.id)
    if (room) room.is_active = false
    return HttpResponse.json(room)
  }),
]

export default adminRoomsHandlers