import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server.js'
import { useCreateBooking } from './useCreateBooking'

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }) => createElement(QueryClientProvider, { client }, children)
  return renderHook(() => useCreateBooking(), { wrapper })
}

describe('useCreateBooking', () => {
  it('reads our user id once from /users/me and sends the explicit slot and players', async () => {
    let body
    server.use(
      http.get('*/users/me', () => HttpResponse.json({ id: 7 })),
      http.post('*/bookings', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 99 }, { status: 201 })
      }),
    )
    const { result } = setup()

    let outcome
    await act(async () => {
      outcome = await result.current.submitBooking({ slotId: 5, players: 4 })
    })

    expect(body).toEqual({ user_id: 7, time_slot_id: 5, players: 4 })
    expect(outcome).toEqual({ success: true, data: { id: 99 } })
  })

  it('exposes the Spanish message of the backend error code', async () => {
    server.use(
      http.get('*/users/me', () => HttpResponse.json({ id: 7 })),
      http.post('*/bookings', () =>
        HttpResponse.json({ detail: 'x', code: 'BOOKING_LIMIT_REACHED' }, { status: 409 }),
      ),
    )
    const { result } = setup()

    await act(async () => {
      await result.current.submitBooking({ slotId: 5, players: 1 })
    })

    expect(result.current.error).toMatch(/límite/i)
  })
})
