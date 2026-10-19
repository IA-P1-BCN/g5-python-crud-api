import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { server } from '@/test/mocks/server.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { toSlot } from '../model/slotMapper.js'
import CheckoutPage from './CheckoutPage.jsx'

const t = es.booking.checkout
const slot = toSlot({ id: 12, starts_at: '2030-11-06T10:00:00Z', state: 'free' })

function Confirmation() {
  return <p>confirmation-page {JSON.stringify(useLocation().state?.booking)}</p>
}

let client
function renderCheckout() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/booking/checkout']}>
        <Routes>
          <Route path="/booking/checkout" element={<CheckoutPage />} />
          <Route path="/booking/confirmation" element={<Confirmation />} />
          <Route path="/reservar/:slug" element={<p>booking-page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function seedDraft() {
  const draft = useBookingDraftStore.getState()
  draft.startRoom('faro')
  draft.setSelectedSlot(slot)
}

beforeEach(() => {
  useBookingDraftStore.getState().resetDraft()
  server.use(
    http.get('/api/v1/rooms/faro', () =>
      HttpResponse.json(roomDto({ id: 7, slug: 'faro', min_players: 2, base_price: '20.00' })),
    ),
    http.get('*/users/me', () => HttpResponse.json({ id: 7, name: 'Loris', role: 'client' })),
  )
})

describe('CheckoutPage', () => {
  it('redirects to the booking page of the room when the draft has no slot', async () => {
    useBookingDraftStore.getState().startRoom('faro')
    renderCheckout()

    expect(await screen.findByText('booking-page')).toBeInTheDocument()
  })

  it('never shows a fake 0,00 price: loading first, then the real room', async () => {
    seedDraft()
    renderCheckout()

    expect(screen.getByRole('status', { name: es.common.loading })).toBeInTheDocument()
    expect(screen.queryByText(/0,00/)).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Faro 1923' })).toBeInTheDocument()
  })

  it('shows an error when the room cannot be loaded', async () => {
    server.use(http.get('/api/v1/rooms/faro', () => new HttpResponse(null, { status: 500 })))
    seedDraft()
    renderCheckout()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.booking.errors.loadRoomFailed)
  })

  it('starts the players at the real min_players of the room', async () => {
    seedDraft()
    renderCheckout()

    await screen.findByRole('heading', { name: 'Faro 1923' })

    expect(screen.getByText(/40,00/)).toBeInTheDocument()
  })

  it('uses the players chosen on the room page and shows the date and time', async () => {
    seedDraft()
    useBookingDraftStore.getState().setPlayers(3)
    renderCheckout()

    await screen.findByRole('heading', { name: 'Faro 1923' })

    expect(screen.getByText(/60,00/)).toBeInTheDocument()
    expect(screen.getByText(formatDateTime(slot.startsAt))).toBeInTheDocument()
  })

  it('sends the booking with our users.id and goes to the confirmation with the real date', async () => {
    let body
    server.use(
      http.post('*/bookings', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 55, status: 'PENDING' }, { status: 201 })
      }),
    )
    seedDraft()
    renderCheckout()

    await userEvent.click(await screen.findByRole('button', { name: t.submit }))

    expect(await screen.findByText(/confirmation-page/)).toHaveTextContent('2030-11-06T10:00:00Z')
    expect(body).toEqual({ user_id: 7, time_slot_id: 12, players: 2 })
  })

  it('invalidates the slots and my bookings caches after a booking', async () => {
    server.use(
      http.post('*/bookings', () =>
        HttpResponse.json({ id: 55, status: 'PENDING' }, { status: 201 }),
      ),
    )
    seedDraft()
    renderCheckout()
    client.setQueryData(['slots', 7, '2030-11-06'], [])
    client.setQueryData(['bookings', 'me'], [])

    await userEvent.click(await screen.findByRole('button', { name: t.submit }))

    await waitFor(() => {
      expect(client.getQueryState(['slots', 7, '2030-11-06']).isInvalidated).toBe(true)
      expect(client.getQueryState(['bookings', 'me']).isInvalidated).toBe(true)
    })
  })

  it.each([
    ['SLOT_TAKEN', 409, t.errors.slotTaken],
    ['SLOT_NOT_AVAILABLE', 409, t.errors.slotTaken],
    ['INVALID_PLAYERS', 422, t.errors.invalidPlayers],
    ['ROOM_INACTIVE', 409, t.errors.roomInactive],
    ['USER_INACTIVE', 409, t.errors.userInactive],
    ['BOOKING_LIMIT_REACHED', 409, t.errors.bookingLimit],
    ['UNAUTHORIZED', 401, t.errors.unauthorized],
  ])('shows its own message for %s', async (code, status, message) => {
    server.use(http.post('*/bookings', () => HttpResponse.json({ detail: 'x', code }, { status })))
    seedDraft()
    renderCheckout()

    await userEvent.click(await screen.findByRole('button', { name: t.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText(/confirmation-page/)).not.toBeInTheDocument()
  })

  it('has no contact fields: the user is already logged in', async () => {
    seedDraft()
    renderCheckout()

    await screen.findByRole('heading', { name: 'Faro 1923' })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
