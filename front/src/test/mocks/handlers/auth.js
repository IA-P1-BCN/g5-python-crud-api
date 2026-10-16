// MSW handlers for the auth endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const meDto = (overrides = {}) => ({
  id: 'u1',
  email: 'ana@example.com',
  name: 'Ana',
  role: 'client',
  ...overrides,
})

export default [
  // Needs a Bearer token, like the real API: without it, 401.
  http.get('/api/v1/users/me', ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
    }
    return HttpResponse.json(meDto())
  }),
]
