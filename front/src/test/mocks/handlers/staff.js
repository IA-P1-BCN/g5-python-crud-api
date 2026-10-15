// MSW handlers for the staff endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const todayBookingDto = (overrides = {}) => ({
  id: 1,
  user_id: 7,
  time_slot_id: 10,
  players: 3,
  total_price: '60.00',
  status: 'CONFIRMED',
  created_at: '2026-10-10T09:00:00Z',
  time_slot: {
    id: 10,
    starts_at: '2026-10-15T16:00:00Z',
    ends_at: '2026-10-15T17:00:00Z',
    status: 'available',
  },
  room: { id: 1, name: 'Faro 1923', slug: 'faro', capacity: 4, base_price: '20.00' },
  user: { name: 'Lucía Pérez' },
  result: null,
  can_modify: false,
  ...overrides,
})

// GET /bookings/today is a plain array, not paginated (API_CONTRACT.md).
// The status changes answer with the booking in its new status.
export default [
  http.get('*/bookings/today', () => HttpResponse.json([todayBookingDto()])),
  http.put('*/bookings/:id/confirm', () =>
    HttpResponse.json(todayBookingDto({ status: 'CONFIRMED' })),
  ),
  http.put('*/bookings/:id/start', () =>
    HttpResponse.json(todayBookingDto({ status: 'IN_PROGRESS' })),
  ),
  http.put('*/bookings/:id/finish', () =>
    HttpResponse.json(todayBookingDto({ status: 'COMPLETED' })),
  ),
  http.post('*/bookings/:id/result', async ({ request }) => {
    const result = await request.json()
    return HttpResponse.json(todayBookingDto({ status: 'COMPLETED', result }), { status: 201 })
  }),
]
