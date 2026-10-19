import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import { roomDto, roomsPage } from '@/test/mocks/handlers/rooms.js'
import { server } from '@/test/mocks/server.js'
import ChangeSlotDialog from './ChangeSlotDialog.jsx'

const t = es.myBookings

const FREE_AT = '2026-10-22T10:00:00Z'
const TAKEN_AT = '2026-10-22T12:00:00Z'
// Same formatting as slotMapper, so the test does not depend on the computer's timezone.
const label = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

const SOON_AT = new Date(Date.now() + 60 * 60 * 1000).toISOString() // free, but under 24h away

const OTHER_AT = '2026-10-23T16:00:00Z'

const slotDto = (id, startsAt, state, roomId = 1) => ({
  id,
  room_id: roomId,
  starts_at: startsAt,
  ends_at: startsAt,
  status: 'available',
  state,
})

// bookingDto: 4 players in room 1 (Faro 1923). Room 3 is too small for them, so it is not offered.
const ROOMS = [
  roomDto({ id: 1, name: 'Faro 1923', capacity: 6 }),
  roomDto({ id: 2, name: 'Sala Bosque', capacity: 5 }),
  roomDto({ id: 3, name: 'Sala Mini', capacity: 2 }),
]

// GET /time-slots answers the same slots for every day of a room: enough for the dialog.
function mockApi() {
  server.use(
    http.get('/api/v1/rooms', () => HttpResponse.json(roomsPage(ROOMS))),
    http.get('/api/v1/time-slots', ({ request }) => {
      const roomId = new URL(request.url).searchParams.get('room_id')
      const items =
        roomId === '2'
          ? [slotDto(30, OTHER_AT, 'free', 2)]
          : [
              slotDto(20, FREE_AT, 'free'),
              slotDto(21, TAKEN_AT, 'taken'),
              slotDto(22, SOON_AT, 'free'),
            ]
      return HttpResponse.json({ items, total: items.length, page: 1, size: 100 })
    }),
  )
}

function renderDialog(onOpenChange = vi.fn()) {
  mockApi()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ChangeSlotDialog booking={bookingDto()} open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return onOpenChange
}

const save = () => screen.getByRole('button', { name: t.changeSlotDialog.save })

describe('ChangeSlotDialog', () => {
  it('disables a taken slot and keeps Save disabled until a free slot is chosen', async () => {
    renderDialog()

    expect(await screen.findByRole('button', { name: label(TAKEN_AT) })).toBeDisabled()
    expect(save()).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: label(FREE_AT) }))
    expect(save()).toBeEnabled()
  })

  it('hides a free slot that starts in less than 24h (BR-L5)', async () => {
    renderDialog()

    expect(await screen.findByRole('button', { name: label(FREE_AT) })).toBeEnabled()
    expect(screen.queryByRole('button', { name: label(SOON_AT) })).not.toBeInTheDocument()
  })

  it('offers the other rooms where the players fit, the current one selected', async () => {
    renderDialog()

    expect(await screen.findByRole('button', { name: 'Faro 1923' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Sala Bosque' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sala Mini' })).not.toBeInTheDocument()
  })

  it('moves the booking to a slot of another room and clears the old choice', async () => {
    let body
    server.use(
      http.put('/api/v1/bookings/1', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(bookingDto({ time_slot_id: 30 }))
      }),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(await screen.findByRole('button', { name: label(FREE_AT) }))
    await userEvent.click(screen.getByRole('button', { name: 'Sala Bosque' }))
    expect(save()).toBeDisabled() // the slot of the first room is no longer selected

    await userEvent.click(await screen.findByRole('button', { name: label(OTHER_AT) }))
    await userEvent.click(save())

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(body).toEqual({ time_slot_id: 30 })
  })

  it('sends the new time_slot_id and closes', async () => {
    let body
    server.use(
      http.put('/api/v1/bookings/1', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(bookingDto({ time_slot_id: 20 }))
      }),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(await screen.findByRole('button', { name: label(FREE_AT) }))
    await userEvent.click(save())

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(body).toEqual({ time_slot_id: 20 })
  })

  it('shows the slot-taken message and stays open when someone booked it first', async () => {
    server.use(
      http.put('/api/v1/bookings/1', () =>
        HttpResponse.json(
          { detail: 'Time slot is already booked', code: 'SLOT_TAKEN' },
          { status: 409 },
        ),
      ),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(await screen.findByRole('button', { name: label(FREE_AT) }))
    await userEvent.click(save())

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.slotTaken)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows the too-late message when the new slot is less than 24h away', async () => {
    server.use(
      http.put('/api/v1/bookings/1', () =>
        HttpResponse.json({ detail: 'Too late', code: 'TOO_LATE_TO_MODIFY' }, { status: 409 }),
      ),
    )
    renderDialog()

    await userEvent.click(await screen.findByRole('button', { name: label(FREE_AT) }))
    await userEvent.click(save())

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.tooLateToModify)
  })
})
