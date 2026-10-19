import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { todayBookingDto } from '@/test/mocks/handlers/staff.js'
import { server } from '@/test/mocks/server.js'
import GameActions from './GameActions.jsx'

// A slot starting now: the same UTC day as the API checks for starting a game (BR-G3).
const slotNow = () => ({
  id: 10,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 3600_000).toISOString(),
  status: 'available',
})

function renderActions(booking) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GameActions booking={booking} />
    </QueryClientProvider>,
  )
}

describe('GameActions', () => {
  it.each([
    ['PENDING', es.staff.actions.confirm],
    ['CONFIRMED', es.staff.actions.start],
    ['IN_PROGRESS', es.staff.actions.finish],
  ])('%s shows only the button "%s"', (status, label) => {
    renderActions(todayBookingDto({ status }))

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('shows no button for a cancelled booking', () => {
    renderActions(todayBookingDto({ status: 'CANCELLED' }))

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it.each([
    ['PENDING', es.staff.actions.confirm, 'confirm'],
    ['CONFIRMED', es.staff.actions.start, 'start'],
    ['IN_PROGRESS', es.staff.actions.finish, 'finish'],
  ])('%s: clicking "%s" calls PUT /bookings/:id/%s', async (status, label, path) => {
    let calledId = null
    server.use(
      http.put(`*/bookings/:id/${path}`, ({ params }) => {
        calledId = params.id
        return HttpResponse.json(todayBookingDto({ id: 5 }))
      }),
    )
    renderActions(todayBookingDto({ id: 5, status, time_slot: slotNow() }))

    await userEvent.click(screen.getByRole('button', { name: label }))

    await waitFor(() => expect(calledId).toBe('5'))
  })

  it('shows the result form for a completed game without result', () => {
    renderActions(todayBookingDto({ status: 'COMPLETED', result: null }))

    expect(screen.getByLabelText(es.staff.resultForm.time)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: es.staff.resultForm.save })).toBeInTheDocument()
  })

  it('shows nothing for a completed game that already has a result', () => {
    const result = { completed: true, completion_time: 1800 }
    renderActions(todayBookingDto({ status: 'COMPLETED', result }))

    expect(screen.queryByLabelText(es.staff.resultForm.time)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows INVALID_TRANSITION as a message', async () => {
    server.use(
      http.put('*/bookings/:id/start', () =>
        HttpResponse.json(
          { detail: 'Invalid transition', code: 'INVALID_TRANSITION' },
          { status: 409 },
        ),
      ),
    )
    renderActions(todayBookingDto({ status: 'CONFIRMED', time_slot: slotNow() }))

    await userEvent.click(screen.getByRole('button', { name: es.staff.actions.start }))

    expect(await screen.findByRole('alert')).toHaveTextContent(es.staff.errors.INVALID_TRANSITION)
  })

  it('refuses to start a game of another day, with a clear message and no API call', async () => {
    let called = false
    server.use(
      http.put('*/bookings/:id/start', () => {
        called = true
        return HttpResponse.json(todayBookingDto())
      }),
    )
    const tomorrow = new Date(Date.now() + 24 * 3600_000).toISOString()
    renderActions(
      todayBookingDto({
        status: 'CONFIRMED',
        time_slot: { ...slotNow(), starts_at: tomorrow },
      }),
    )

    await userEvent.click(screen.getByRole('button', { name: es.staff.actions.start }))

    expect(screen.getByRole('alert')).toHaveTextContent(es.staff.errors.NOT_GAME_DAY)
    expect(called).toBe(false)
  })
})
