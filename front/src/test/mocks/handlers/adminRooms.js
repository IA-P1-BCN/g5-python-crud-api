import { http, HttpResponse } from 'msw'

const initialRooms = () => [
  {
    id: 1,
    slug: 'sala-prueba',
    name: 'Sala de Prueba',
    genre: 'Misterio',
    duration: 60,
    base_price: 50,
    capacity: 4,
    min_players: 2,
    difficulty: 3,
    hook: 'Hook de prueba',
    story: 'Historia de prueba',
    audience: 'General',
    status: 'active',
    is_active: true,
    has_upcoming_slots: true,
  },
]

let mockRooms = initialRooms()

export const resetMockRooms = () => {
  mockRooms = initialRooms()
}

// Lets a test load many rooms to check pagination.
export const seedMockRooms = (rooms) => {
  mockRooms = rooms
}

// --- Slots ---------------------------------------------------------------

const at = (day, hour) => new Date(2030, 10, day, hour, 0).toISOString()

function withState(slot) {
  const blocked = slot.status === 'blocked'
  return { ...slot, state: blocked ? 'blocked' : 'free', is_bookable: !blocked }
}

const initialSlots = () =>
  [
    { id: 1, room_id: 1, starts_at: at(4, 10), ends_at: at(4, 11), status: 'available' },
    { id: 2, room_id: 1, starts_at: at(4, 12), ends_at: at(4, 13), status: 'blocked' },
  ].map(withState)

let mockSlots = initialSlots()

export const resetMockSlots = () => {
  mockSlots = initialSlots()
}

// Lets a test load more slots than one page holds.
export const seedMockSlots = (slots) => {
  mockSlots = slots.map(withState)
}

// --- Handlers ------------------------------------------------------------

export const adminRoomsHandlers = [
  // Same shape as the real API: { items, total, page, size }.
  http.get('/api/v1/rooms', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const size = Number(url.searchParams.get('size') ?? 20)
    const items = mockRooms.slice((page - 1) * size, page * size)
    return HttpResponse.json({ items, total: mockRooms.length, page, size })
  }),

  http.post('/api/v1/rooms', async ({ request }) => {
    const body = await request.clone().json()
    if (body.slug === 'slug-duplicado' || body.slug === 'existing-slug') {
      return HttpResponse.json(
        { detail: 'Slug already exists', code: 'DUPLICATE' },
        { status: 409 },
      )
    }
    const newRoom = { id: Date.now(), status: 'active', is_active: true, ...body }
    mockRooms.push(newRoom)
    return HttpResponse.json(newRoom, { status: 201 })
  }),

  // The real API uses PUT /rooms/{id}/activate and /deactivate (API_CONTRACT.md).
  http.put('/api/v1/rooms/:roomId/:action', ({ params }) => {
    const active = params.action === 'activate'
    if (!active && params.action !== 'deactivate') return new HttpResponse(null, { status: 404 })
    const id = Number(params.roomId)
    mockRooms = mockRooms.map((r) =>
      r.id === id ? { ...r, is_active: active, status: active ? 'active' : 'inactive' } : r,
    )
    return HttpResponse.json(mockRooms.find((r) => r.id === id))
  }),

  http.get('/api/v1/time-slots', ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 1)
    const size = Number(params.get('size') ?? 20)
    const all = [...mockSlots].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    const items = all.slice((page - 1) * size, page * size)
    return HttpResponse.json({ items, total: all.length, page, size })
  }),

  http.post('/api/v1/time-slots', async ({ request }) => {
    const body = await request.clone().json()
    const slot = withState({ id: Date.now(), status: 'available', ...body })
    mockSlots = [...mockSlots, slot]
    return HttpResponse.json(slot, { status: 201 })
  }),

  http.put('/api/v1/time-slots/:slotId', async ({ params, request }) => {
    const id = Number(params.slotId)
    const body = await request.clone().json()
    const current = mockSlots.find((s) => s.id === id)
    if (!current) {
      return HttpResponse.json(
        { detail: 'Time slot not found', code: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    const updated = withState({ ...current, ...body })
    mockSlots = mockSlots.map((s) => (s.id === id ? updated : s))
    return HttpResponse.json(updated)
  }),

  // POST /rooms/{id}/time-slots/generate -> { created_count, skipped_count } (API_CONTRACT.md).
  // The mock creates one slot per day of the range at first_start.
  http.post('/api/v1/rooms/:roomId/time-slots/generate', async ({ params, request }) => {
    const body = await request.clone().json()
    const created = []
    for (
      let d = new Date(body.date_from);
      d <= new Date(body.date_to);
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const day = d.toISOString().slice(0, 10)
      const start = Date.parse(`${day}T${body.first_start}:00Z`)
      created.push(
        withState({
          id: Date.now() + created.length,
          room_id: Number(params.roomId),
          starts_at: new Date(start).toISOString(),
          ends_at: new Date(start + 60 * 60 * 1000).toISOString(),
          status: 'available',
        }),
      )
    }
    mockSlots = [...mockSlots, ...created]
    return HttpResponse.json({ created_count: created.length, skipped_count: 0 })
  }),

  http.delete('/api/v1/time-slots/:slotId', ({ params }) => {
    mockSlots = mockSlots.filter((s) => s.id !== Number(params.slotId))
    return new HttpResponse(null, { status: 204 })
  }),
]

export default adminRoomsHandlers
