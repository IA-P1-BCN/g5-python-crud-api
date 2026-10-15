import { http, HttpResponse } from 'msw'

const rooms = [
  { id: '1', slug: 'room-one', name: 'Room One', genre: 'Terror', duration: 60, base_price: 50, capacity: 6, min_players: 2, difficulty: 4, hook: 'Hook 1', story: 'Story 1', audience: 'Adults', is_active: true },
]

let mockSlots = [
  { id: '1', startTime: '09:00', endTime: '10:00', isBlocked: false, hasActiveBooking: false },
  { id: '2', startTime: '10:00', endTime: '11:00', isBlocked: true, hasActiveBooking: true },
];

export const adminRoomsHandlers = [
  // Handlers de Salas (Ticket 069)
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

  // Handlers de Franjas Horarias (Ticket 070)
  http.get('/api/v1/rooms/:roomId/slots', () => {
    return HttpResponse.json(mockSlots);
  }),
  http.post('/api/v1/rooms/:roomId/slots', async ({ request }) => {
    const body = await request.json();
    if (body.startTime === '09:00') {
      return HttpResponse.json({ code: 'SLOT_OVERLAP' }, { status: 400 });
    }
    const newSlot = { id: String(Date.now()), ...body, hasActiveBooking: false };
    mockSlots.push(newSlot);
    return HttpResponse.json(newSlot, { status: 201 });
  }),
  http.put('/api/v1/rooms/:roomId/slots/:slotId', async ({ params, request }) => {
    const { slotId } = params;
    const body = await request.json();
    const slot = mockSlots.find(s => s.id === slotId);
    if (slot && slot.hasActiveBooking) {
      return HttpResponse.json({ code: 'SLOT_ACTIVE_BOOKING' }, { status: 400 });
    }
    mockSlots = mockSlots.map(s => s.id === slotId ? { ...s, ...body } : s);
    return HttpResponse.json({ success: true });
  }),
  http.delete('/api/v1/rooms/:roomId/slots/:slotId', ({ params }) => {
    const { slotId } = params;
    const slot = mockSlots.find(s => s.id === slotId);
    if (slot && slot.hasActiveBooking) {
      return HttpResponse.json({ code: 'SLOT_ACTIVE_BOOKING' }, { status: 400 });
    }
    mockSlots = mockSlots.filter(s => s.id !== slotId);
    return HttpResponse.json({ success: true });
  }),
];

export default adminRoomsHandlers;