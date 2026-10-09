import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { useRooms } from './useRooms.js'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const respondWith = (body, status = 200) =>
  server.use(http.get('/api/v1/rooms', () => HttpResponse.json(body, { status })))

describe('useRooms', () => {
  it('is pending while the request is in flight', () => {
    respondWith([roomDto()])
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(true)
  })

  it('returns the rooms mapped to the view model', async () => {
    respondWith([roomDto()])
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      expect.objectContaining({ slug: 'faro', maxPlayers: 4, pricePerPlayer: 20 }),
    ])
  })

  it('keeps only rooms visible to clients (BR-R4, BR-R6)', async () => {
    respondWith([
      roomDto({ id: 1, slug: 'faro' }),
      roomDto({ id: 2, slug: 'nueva', has_upcoming_slots: false }),
      roomDto({ id: 3, slug: 'lab', status: 'inactive' }),
    ])
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.map((r) => r.slug)).toEqual(['faro'])
  })

  it('returns an empty list when there is no room', async () => {
    respondWith([])
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('exposes the error when the API fails', async () => {
    respondWith({ code: 'INTERNAL_ERROR' }, 500)
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
