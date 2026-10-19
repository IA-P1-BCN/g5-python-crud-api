import { http, HttpResponse } from 'msw'

export default [
  http.put('*/users/me', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'u1', email: 'ana@example.com', role: 'client', ...body })
  }),
]
