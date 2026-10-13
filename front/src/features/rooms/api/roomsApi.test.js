import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server.js'
import { fetchActiveRooms } from './roomsApi.js'

describe('fetchActiveRooms', () => {
  it('calls GET /api/v1/rooms?status=active and returns the raw list', async () => {
    let requestedUrl
    server.use(
      http.get('/api/v1/rooms', ({ request }) => {
        requestedUrl = new URL(request.url)
        return HttpResponse.json([{ id: 1, slug: 'faro' }])
      }),
    )

    const rooms = await fetchActiveRooms()

    expect(requestedUrl.searchParams.get('status')).toBe('active')
    expect(rooms).toEqual([{ id: 1, slug: 'faro' }])
  })

  it('rejects when the API fails (the hook will expose the error)', async () => {
    server.use(
      http.get('/api/v1/rooms', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )

    await expect(fetchActiveRooms()).rejects.toBeDefined()
  })
})
