import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { server } from '@/test/mocks/server.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { Booker } from './Booker.jsx'

const room = { id: 7, slug: 'faro', minPlayers: 2, maxPlayers: 4, pricePerPlayer: 20 }

const slotDto = (id, hour, state) => ({
  id,
  room_id: 7,
  starts_at: `2030-01-01T${hour}:00:00Z`,
  ends_at: `2030-01-01T${hour}:59:00Z`,
  status: 'available',
  state,
  is_bookable: state === 'free',
})

function renderBooker() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Booker room={room} />} />
          <Route path="/booking/checkout" element={<p>checkout-page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useBookingDraftStore.getState().reset()
  server.use(
    http.get('/api/v1/time-slots', () =>
      HttpResponse.json({
        items: [slotDto(1, '10', 'free'), slotDto(2, '11', 'taken')],
        total: 2,
        page: 1,
        size: 100,
      }),
    ),
  )
})

describe('Booker', () => {
  it('offers 5 days, the slots and the players of the room', async () => {
    renderBooker()

    const days = await screen.findByRole('group', { name: es.booking.selectDay })
    expect(within(days).getAllByRole('button')).toHaveLength(5)
    await screen.findByRole('group', { name: es.booking.selectTime })
    const dial = screen.getByRole('group', { name: es.booking.selectPlayers })
    expect(
      within(dial)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['2', '3', '4'])
  })

  it('starts the draft at the min players and keeps the chosen players in it', async () => {
    renderBooker()
    await screen.findByRole('group', { name: es.booking.selectTime })
    expect(useBookingDraftStore.getState().players).toBe(2)

    const dial = screen.getByRole('group', { name: es.booking.selectPlayers })
    await userEvent.click(within(dial).getByRole('button', { name: '4' }))

    expect(useBookingDraftStore.getState().players).toBe(4)
    expect(screen.getByText(/80,00/)).toBeInTheDocument()
  })

  it('keeps Reservar disabled until a free slot is chosen, then goes to checkout', async () => {
    renderBooker()
    const grid = await screen.findByRole('group', { name: es.booking.selectTime })
    const reserve = screen.getByRole('button', { name: es.booking.continue })
    expect(reserve).toBeDisabled()
    expect(screen.getByText(es.booking.summary.noSlot)).toBeInTheDocument()

    await userEvent.click(within(grid).getAllByRole('button')[0])

    expect(screen.queryByText(es.booking.summary.noSlot)).not.toBeInTheDocument()
    await userEvent.click(reserve)
    expect(screen.getByText('checkout-page')).toBeInTheDocument()
  })
})
