import { http, HttpResponse } from 'msw';

let mockRooms = [
  {
    id: '1',
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
    is_active: true,
  },
];

// --- Slots ---------------------------------------------------------------

const at = (day, hour) => new Date(2030, 10, day, hour, 0).toISOString();

function withState(slot) {
  const blocked = slot.status === 'blocked';
  return { ...slot, state: blocked ? 'blocked' : 'free', is_bookable: !blocked };
}

const initialSlots = () =>
  [
    { id: 1, room_id: 1, starts_at: at(4, 10), ends_at: at(4, 11), status: 'available' },
    { id: 2, room_id: 1, starts_at: at(4, 12), ends_at: at(4, 13), status: 'blocked' },
  ].map(withState);

let mockSlots = initialSlots();

export const resetMockSlots = () => {
  mockSlots = initialSlots();
};

// --- Handlers ------------------------------------------------------------

export const adminRoomsHandlers = [
  http.get('/api/v1/rooms', () => {
    return HttpResponse.json(mockRooms);
  }),

  http.post('/api/v1/rooms', async ({ request }) => {
    const body = await request.clone().json();
    if (body.slug === 'slug-duplicado' || body.slug === 'existing-slug') {
      return HttpResponse.json(
        { detail: 'Slug already exists', code: 'DUPLICATE' },
        { status: 409 },
      );
    }
    const newRoom = { id: String(Date.now()), is_active: true, ...body };
    mockRooms.push(newRoom);
    return HttpResponse.json(newRoom, { status: 201 });
  }),

  http.patch('/api/v1/rooms/:roomId', async ({ params, request }) => {
    const { roomId } = params;
    const body = await request.clone().json();
    mockRooms = mockRooms.map((r) => (r.id === roomId ? { ...r, ...body } : r));
    const updated = mockRooms.find((r) => r.id === roomId);
    return HttpResponse.json(updated);
  }),

  http.get('/api/v1/time-slots', () => {
    const items = [...mockSlots].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return HttpResponse.json({ items, total: items.length, page: 1, size: 100 });
  }),

  http.post('/api/v1/time-slots', async ({ request }) => {
    const body = await request.clone().json();
    const slot = withState({ id: Date.now(), status: 'available', ...body });
    mockSlots = [...mockSlots, slot];
    return HttpResponse.json(slot, { status: 201 });
  }),

  http.put('/api/v1/time-slots/:slotId', async ({ params, request }) => {
    const id = Number(params.slotId);
    const body = await request.clone().json();
    const current = mockSlots.find((s) => s.id === id);
    if (!current) {
      return HttpResponse.json(
        { detail: 'Time slot not found', code: 'SLOT_NOT_FOUND' },
        { status: 404 },
      );
    }
    const updated = withState({ ...current, ...body });
    mockSlots = mockSlots.map((s) => (s.id === id ? updated : s));
    return HttpResponse.json(updated);
  }),

  http.delete('/api/v1/time-slots/:slotId', ({ params }) => {
    mockSlots = mockSlots.filter((s) => s.id !== Number(params.slotId));
    return new HttpResponse(null, { status: 204 });
  }),
];

export default adminRoomsHandlers;