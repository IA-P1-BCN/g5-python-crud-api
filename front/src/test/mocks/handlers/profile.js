// MSW handlers for the profile endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
// GET /users/me lives in handlers/auth.js and GET /users/me/history in handlers/myBookings.js.
import { http, HttpResponse } from 'msw'

export default [
  // Echoes what it receives, like the real API.
  http.put('*/users/me', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'u1', email: 'ana@example.com', role: 'client', ...body })
  }),
]
