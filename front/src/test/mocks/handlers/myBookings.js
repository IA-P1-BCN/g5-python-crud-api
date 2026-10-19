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

export const bookingDto = (overrides = {}) => ({
  id: 1,
  user_id: 7,
  time_slot_id: 10,
  players: 4,
  status: 'CONFIRMED',
  total_price: '80.00',
  can_modify: true,
  time_slot: {
    id: 10,
    starts_at: '2026-10-20T16:00:00Z',
    ends_at: '2026-10-20T17:00:00Z',
    status: 'available',
  },
  room: { id: 1, name: 'Faro 1923', slug: 'faro', capacity: 6, base_price: '20.00' },
  user: { name: 'Marie' },
  result: null,
  ...overrides,
})

// GET /bookings is the paginated envelope (API_CONTRACT.md).
export const bookingsPage = (items) => ({ items, total: items.length, page: 1, size: 100 })

// GET /users/me as the API returns it: the numeric DB id (bookings.user_id), not the Supabase id.
// Use with server.use(...) in tests that need the logged-in user (the default one in auth.js needs a token).
export const meHandler = (overrides = {}) =>
  http.get('*/users/me', () =>
    HttpResponse.json({
      id: 7,
      email: 'ana@example.com',
      name: 'Ana',
      role: 'client',
      ...overrides,
    }),
  )

// GET /users/me/history is a plain array, not paginated (API_CONTRACT.md).
export default [
  http.get('*/users/me/history', () => HttpResponse.json([historyItemDto()])),
  http.get('*/bookings', () => HttpResponse.json(bookingsPage([bookingDto()]))),
]
