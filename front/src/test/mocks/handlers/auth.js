import { http, HttpResponse } from 'msw'

export const meDto = (overrides = {}) => ({
  id: 'u1',
  email: 'ana@example.com',
  name: 'Ana',
  role: 'client',
  ...overrides,
})

export default [
  http.get('/api/v1/users/me', ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
    }
    return HttpResponse.json(meDto())
  }),
]
