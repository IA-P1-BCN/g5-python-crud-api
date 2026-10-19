// MSW handlers for the adminUsers endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const userDto = (overrides = {}) => ({
  id: 1,
  name: 'Ana Admin',
  email: 'ana@example.com',
  phone: null,
  role: 'admin',
  is_active: true,
  created_at: '2026-09-01T10:00:00Z',
  ...overrides,
})

// GET /users is paginated: { items, total, page, size } (API_CONTRACT.md, Pagination).
export const usersPage = (items, overrides = {}) => ({
  items,
  total: items.length,
  page: 1,
  size: 20,
  ...overrides,
})

const initialUsers = () => [
  userDto(),
  userDto({ id: 2, name: 'Bruno Cliente', email: 'bruno@example.com', role: 'client' }),
  userDto({ id: 3, name: 'Carla Staff', email: 'carla@example.com', role: 'staff' }),
  userDto({
    id: 4,
    name: 'Dani Inactivo',
    email: 'dani@example.com',
    role: 'client',
    is_active: false,
  }),
]

// Stateful on purpose: a change made through PUT shows up in the next GET, like with the real API.
let users = initialUsers()

export function resetMockUsers() {
  users = initialUsers()
}

function update(id, changes) {
  const index = users.findIndex((user) => user.id === Number(id))
  if (index === -1) {
    return HttpResponse.json({ detail: 'User not found', code: 'NOT_FOUND' }, { status: 404 })
  }
  users[index] = { ...users[index], ...changes }
  return HttpResponse.json(users[index])
}

export default [
  http.get('/api/v1/users', ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 1)
    const size = Number(params.get('size') ?? 20)
    const items = users.slice((page - 1) * size, page * size)
    return HttpResponse.json({ items, total: users.length, page, size })
  }),

  http.put('/api/v1/users/:id/deactivate', ({ params }) => update(params.id, { is_active: false })),

  http.put('/api/v1/users/:id/role', async ({ params, request }) => {
    const { role } = await request.json()
    return update(params.id, { role })
  }),
]
