import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { server } from '@/test/mocks/server.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { BookingPage } from './BookingPage.jsx'
import CheckoutPage from './CheckoutPage.jsx'

const slotDto = (id, hour) => ({
  id,
  room_id: 7,
  starts_at: `2030-01-01T${hour}:00:00Z`,
  ends_at: `2030-01-01T${hour}:59:00Z`,
  status: 'available',
  state: 'free',
  is_bookable: true,
})

function renderFlow() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/reservar/faro']}>
        <Routes>
          <Route path="/reservar/:slug" element={<BookingPage />} />
          <Route path="/booking/checkout" element={<CheckoutPage />} />
          <Route path="/booking/confirmation" element={<p>confirmation-page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useBookingDraftStore.getState().reset()
  server.use(
    http.get('/api/v1/rooms/faro', () => HttpResponse.json(roomDto({ id: 7, slug: 'faro' }))),
    http.get('/api/v1/time-slots', () =>
      HttpResponse.json({ items: [slotDto(1, '10')], total: 1, page: 1, size: 100 }),
    ),
  )
})

describe('Booking flow', () => {
  it('lets the user pick a slot, reach checkout and see the room in the checkout', async () => {
    renderFlow()

    const grid = await screen.findByRole('group', { name: es.booking.selectTime })
    await userEvent.click(within(grid).getAllByRole('button')[0])
    await userEvent.click(screen.getByRole('button', { name: es.booking.continue }))

    expect(await screen.findByRole('heading', { name: es.booking.checkout.title })).toBeInTheDocument()
    expect(useBookingDraftStore.getState().roomSlug).toBe('faro')
    expect(screen.getByRole('button', { name: es.booking.checkout.submit })).toBeEnabled()
  })
})