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

const slotDto = (id, hour, state) => ({
  id,
  room_id: 7,
  starts_at: `2030-01-01T${hour}:00:00Z`,
  ends_at: `2030-01-01T${hour}:59:00Z`,
  status: 'available',
  state,
  is_bookable: state === 'free',
})

const slotsPage = (items) => ({ items, total: items.length, page: 1, size: 100 })

function renderPage(path = '/reservar/faro') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reservar/:slug" element={<BookingPage />} />
          <Route path="/booking/checkout" element={<div>checkout-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useBookingDraftStore.getState().reset()
  server.use(
    http.get('/api/v1/rooms/faro', () => HttpResponse.json(roomDto({ id: 7, slug: 'faro' }))),
  )
})

describe('BookingPage', () => {
  it('asks the API for the slots of the room of the URL and the chosen day', async () => {
    let params
    server.use(
      http.get('/api/v1/time-slots', ({ request }) => {
        params = new URL(request.url).searchParams
        return HttpResponse.json(slotsPage([slotDto(1, '10', 'free')]))
      }),
    )
    renderPage()

    await screen.findByRole('group', { name: es.booking.selectTime })

    expect(params.get('room_id')).toBe('7')
    expect(params.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows loading and then one button per slot, only the free one enabled', async () => {
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json(
          slotsPage([
            slotDto(1, '10', 'free'),
            slotDto(2, '11', 'taken'),
            slotDto(3, '12', 'blocked'),
            slotDto(4, '13', 'past'),
          ]),
        ),
      ),
    )
    renderPage()

    expect(screen.getByRole('status', { name: es.booking.loadingSlots })).toBeInTheDocument()
    const grid = await screen.findByRole('group', { name: es.booking.selectTime })
    const buttons = within(grid).getAllByRole('button')

    expect(buttons.map((button) => button.disabled)).toEqual([false, true, true, true])
  })

  it('saves the chosen free slot in the booking draft', async () => {
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json(slotsPage([slotDto(1, '10', 'free')])),
      ),
    )
    renderPage()

    const grid = await screen.findByRole('group', { name: es.booking.selectTime })
    await userEvent.click(within(grid).getAllByRole('button')[0])

    expect(useBookingDraftStore.getState().selectedSlot.id).toBe(1)
  })

  it('goes to checkout after choosing a free slot', async () => {
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json(slotsPage([slotDto(1, '10', 'free')])),
      ),
    )
    renderPage()

    const grid = await screen.findByRole('group', { name: es.booking.selectTime })
    const continueButton = screen.getByRole('button', { name: es.booking.continue })
    expect(continueButton).toBeDisabled()

    await userEvent.click(within(grid).getAllByRole('button')[0])
    await userEvent.click(continueButton)

    expect(screen.getByText('checkout-page')).toBeInTheDocument()
  })

  it('shows an error when the API fails', async () => {
    server.use(http.get('/api/v1/time-slots', () => new HttpResponse(null, { status: 500 })))
    renderPage()

    expect(await screen.findByText(es.booking.errors.loadFailed)).toBeInTheDocument()
  })

  it('does not carry a slot chosen in another room: Continuar stays disabled', async () => {
    useBookingDraftStore.getState().startRoom('mansion')
    useBookingDraftStore.getState().setSelectedSlot({ id: 99, startsAt: '2030-01-01T10:00:00Z' })
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json(slotsPage([slotDto(1, '10', 'free')])),
      ),
    )
    renderPage()

    await screen.findByRole('group', { name: es.booking.selectTime })

    expect(useBookingDraftStore.getState().selectedSlot).toBeNull()
    expect(screen.getByRole('button', { name: es.booking.continue })).toBeDisabled()
  })

  it('keeps Continuar disabled when the selected slot is not in the displayed slots', async () => {
    useBookingDraftStore.getState().startRoom('faro')
    useBookingDraftStore.getState().setSelectedSlot({ id: 99, startsAt: '2030-01-01T10:00:00Z' })
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json(slotsPage([slotDto(1, '10', 'free')])),
      ),
    )
    renderPage()

    await screen.findByRole('group', { name: es.booking.selectTime })

    expect(screen.getByRole('button', { name: es.booking.continue })).toBeDisabled()
  })

  it('shows "room not found" instead of an endless spinner when the room does not exist', async () => {
    server.use(http.get('/api/v1/rooms/nope', () => new HttpResponse(null, { status: 404 })))
    renderPage('/reservar/nope')

    expect(await screen.findByText(es.booking.roomNotFound)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows "room not found" for an inactive room', async () => {
    server.use(
      http.get('/api/v1/rooms/off', () =>
        HttpResponse.json(roomDto({ id: 8, slug: 'off', status: 'inactive' })),
      ),
    )
    renderPage('/reservar/off')

    expect(await screen.findByText(es.booking.roomNotFound)).toBeInTheDocument()
  })

  it('shows an error alert when loading the room fails', async () => {
    server.use(http.get('/api/v1/rooms/boom', () => new HttpResponse(null, { status: 500 })))
    renderPage('/reservar/boom')

    expect(await screen.findByRole('alert')).toHaveTextContent(es.booking.errors.loadRoomFailed)
  })
})
