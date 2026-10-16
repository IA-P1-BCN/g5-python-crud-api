import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { bookingDto, bookingsPage } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import { useMyBookings } from './useMyBookings.js'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useMyBookings', () => {
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

  it('exposes the error when the API fails', async () => {
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useMyBookings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
