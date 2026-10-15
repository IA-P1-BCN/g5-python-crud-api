// MSW handlers for the myBookings endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const historyItemDto = (overrides = {}) => ({
  id: 1,
  players: 4,
  status: 'COMPLETED',
  total_price: '80.00',
  time_slot: {
    id: 10,
    starts_at: '2026-10-10T16:00:00Z',
    ends_at: '2026-10-10T17:00:00Z',
    status: 'available',
  },
  room: { id: 1, name: 'Faro 1923', slug: 'faro', capacity: 6, base_price: '20.00' },
  result: { completed: true, completion_time: 2710 },
  ...overrides,
})

// GET /users/me/history is a plain array, not paginated (API_CONTRACT.md).
export default [http.get('*/users/me/history', () => HttpResponse.json([historyItemDto()]))]
