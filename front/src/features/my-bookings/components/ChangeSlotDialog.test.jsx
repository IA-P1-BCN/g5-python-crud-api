import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import ChangeSlotDialog from './ChangeSlotDialog.jsx'

const t = es.myBookings

const FREE_AT = '2026-10-22T10:00:00Z'
const TAKEN_AT = '2026-10-22T12:00:00Z'
// Same formatting as slotMapper, so the test does not depend on the computer's timezone.
const label = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

const SOON_AT = new Date(Date.now() + 60 * 60 * 1000).toISOString() // free, but under 24h away

const slotDto = (id, startsAt, state) => ({
  id,
  room_id: 1,
  starts_at: startsAt,
  ends_at: startsAt,
  status: 'available',
  state,
})

// GET /time-slots answers the same slots for every day: enough for the dialog.
function mockSlots() {
  server.use(
    http.get('/api/v1/time-slots', () =>
      HttpResponse.json({
        items: [
          slotDto(20, FREE_AT, 'free'),
          slotDto(21, TAKEN_AT, 'taken'),
          slotDto(22, SOON_AT, 'free'),
        ],
        total: 3,
        page: 1,
        size: 100,
      }),
    ),
  )
}

function renderDialog(onOpenChange = vi.fn()) {
  mockSlots()
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
