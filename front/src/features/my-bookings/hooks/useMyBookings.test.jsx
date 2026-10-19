import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { bookingDto, bookingsPage, meHandler } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import { useMyBookings } from './useMyBookings.js'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useMyBookings', () => {
  beforeEach(() => server.use(meHandler()))

  it('returns my bookings (items of the paginated list)', async () => {
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json(bookingsPage([bookingDto({ id: 1 }), bookingDto({ id: 2 })])),
      ),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.map((b) => b.id)).toEqual([1, 2])
  })

  it('asks for the biggest page (size=100) so no booking is cut', async () => {
    let size
    server.use(
      http.get('/api/v1/bookings', ({ request }) => {
        size = new URL(request.url).searchParams.get('size')
        return HttpResponse.json(bookingsPage([]))
      }),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(size).toBe('100')
  })

  it('sends user_id of the logged-in user, so staff only get their own bookings', async () => {
    server.use(
      meHandler({ id: 42, role: 'staff' }),
      http.get('/api/v1/bookings', ({ request }) => {
        const userId = new URL(request.url).searchParams.get('user_id')
        // Like the API for staff/admin: without user_id everybody's bookings come back.
        const all = [bookingDto({ id: 1, user_id: 42 }), bookingDto({ id: 2, user_id: 99 })]
        const items = userId ? all.filter((b) => String(b.user_id) === userId) : all
        return HttpResponse.json(bookingsPage(items))
      }),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.map((b) => b.id)).toEqual([1])
  })

  it('exposes the error when the API fails', async () => {
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('exposes the error when the current user cannot be loaded', async () => {
    server.use(
      http.get('*/users/me', () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
