import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server.js'
import { api, setAuthTokenGetter, setUnauthorizedHandler } from './client.js'

describe('api client', () => {
  const cleanups = []
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup())
  })

  it('uses the relative /api/v1 base URL (same origin, no CORS)', () => {
    expect(api.defaults.baseURL).toBe('/api/v1')
  })

  it('adds the JWT as a Bearer token when there is a session', async () => {
    let received = null
    server.use(
      http.get('/api/v1/ping', ({ request }) => {
        received = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    cleanups.push(setAuthTokenGetter(async () => 'jwt-123'))

    await api.get('/ping')

    expect(received).toBe('Bearer jwt-123')
  })

  it('sends no Authorization header when logged out', async () => {
    let received = 'unset'
    server.use(
      http.get('/api/v1/ping', ({ request }) => {
        received = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    cleanups.push(setAuthTokenGetter(async () => null))

    await api.get('/ping')

    expect(received).toBeNull()
  })

  it('calls the unauthorized handler on a 401 and still rejects', async () => {
    server.use(
      http.get('/api/v1/ping', () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })),
    )
    const onUnauthorized = vi.fn()
    cleanups.push(setUnauthorizedHandler(onUnauthorized))

    await expect(api.get('/ping')).rejects.toMatchObject({ response: { status: 401 } })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
