import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { todayBookingDto } from '@/test/mocks/handlers/staff.js'
import { server } from '@/test/mocks/server.js'
import StaffPlanningPage from './StaffPlanningPage.jsx'

const respondWith = (body, status = 200) =>
  server.use(http.get('/api/v1/bookings/today', () => HttpResponse.json(body, { status })))

// Same formatting as the table, so the test does not depend on the machine's time zone.
const hour = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <StaffPlanningPage />
    </QueryClientProvider>,
  )
}

describe('StaffPlanningPage', () => {
  it('shows a loading status while the bookings are fetched', () => {
    respondWith([])
    renderPage()

    expect(screen.getByRole('status', { name: es.staff.loading })).toBeInTheDocument()
  })

  it("lists today's bookings by time with a status badge", async () => {
    const morning = '2026-10-15T09:00:00Z'
    const evening = '2026-10-15T18:00:00Z'
    respondWith([
      todayBookingDto({
        id: 1,
        status: 'CONFIRMED',
        time_slot: {
          id: 10,
          starts_at: morning,
          ends_at: '2026-10-15T10:00:00Z',
          status: 'available',
        },
        user: { name: 'Lucía Pérez' },
      }),
      todayBookingDto({
        id: 2,
        status: 'IN_PROGRESS',
        time_slot: {
          id: 11,
          starts_at: evening,
          ends_at: '2026-10-15T19:00:00Z',
          status: 'available',
        },
        user: { name: 'Marc Soler' },
      }),
    ])
    renderPage()

    const rows = await screen.findAllByRole('row')
    // rows[0] is the header row
    expect(within(rows[1]).getByText(hour(morning))).toBeInTheDocument()
    expect(within(rows[1]).getByText('Lucía Pérez')).toBeInTheDocument()
    expect(within(rows[1]).getByText(es.staff.statuses.CONFIRMED)).toBeInTheDocument()
    expect(within(rows[2]).getByText(hour(evening))).toBeInTheDocument()
    expect(within(rows[2]).getByText(es.staff.statuses.IN_PROGRESS)).toBeInTheDocument()
  })

  it('shows the next action button on each row', async () => {
    respondWith([
      todayBookingDto({ id: 1, status: 'CONFIRMED' }),
      todayBookingDto({ id: 2, status: 'IN_PROGRESS' }),
      todayBookingDto({ id: 3, status: 'CANCELLED' }),
    ])
    renderPage()

    const rows = await screen.findAllByRole('row')
    // rows[0] is the header row
    expect(
      within(rows[1]).getByRole('button', { name: es.staff.actions.start }),
    ).toBeInTheDocument()
    expect(
      within(rows[2]).getByRole('button', { name: es.staff.actions.finish }),
    ).toBeInTheDocument()
    expect(within(rows[3]).queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an empty state when there is no game today', async () => {
    respondWith([])
    renderPage()

    expect(await screen.findByText(es.staff.empty)).toBeInTheDocument()
  })

  it('shows an error when the bookings cannot be loaded', async () => {
    respondWith({ detail: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.staff.loadError)
  })

  it('filters the list by status with the chips, and "Todas" shows everything again', async () => {
    respondWith([
      todayBookingDto({ id: 1, status: 'CONFIRMED', user: { name: 'Lucía Pérez' } }),
      todayBookingDto({ id: 2, status: 'COMPLETED', user: { name: 'Marc Soler' } }),
    ])
    renderPage()
    await screen.findByText('Lucía Pérez')

    await userEvent.click(screen.getByRole('button', { name: es.staff.statuses.COMPLETED }))
    expect(screen.queryByText('Lucía Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('Marc Soler')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: es.staff.filterAll }))
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument()
  })

  it('says so when no booking has the chosen status', async () => {
    respondWith([todayBookingDto({ id: 1, status: 'CONFIRMED' })])
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: es.staff.statuses.IN_PROGRESS }),
    )

    expect(screen.getByText(es.staff.emptyFilter)).toBeInTheDocument()
  })
})
