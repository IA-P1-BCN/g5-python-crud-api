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

  it("opens on today's bookings (any status) and has no date picker", async () => {
    respondWith([todayBookingDto({ id: 1, status: 'COMPLETED', user: { name: 'Lucía Pérez' } })])
    renderPage()

    expect(await screen.findByText('Lucía Pérez')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: es.staff.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: es.staff.filterToday })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByLabelText(/d[ií]a/i)).not.toBeInTheDocument()
  })

  it('a status chip lists the bookings with that status whatever the date', async () => {
    respondWith([todayBookingDto({ id: 1, user: { name: 'Lucía Pérez' } })])
    let query
    server.use(
      http.get('/api/v1/bookings', ({ request }) => {
        query = new URL(request.url).searchParams
        return HttpResponse.json({
          items: [todayBookingDto({ id: 2, status: 'PENDING', user: { name: 'Marc Soler' } })],
          total: 1,
          page: 1,
          size: 100,
        })
      }),
    )
    renderPage()
    await screen.findByText('Lucía Pérez')

    await userEvent.click(screen.getByRole('button', { name: es.staff.statuses.PENDING }))

    expect(await screen.findByText('Marc Soler')).toBeInTheDocument()
    expect(query.get('status')).toBe('PENDING')
    expect(query.get('date_from')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: es.staff.filterToday }))
    expect(await screen.findByText('Lucía Pérez')).toBeInTheDocument()
  })

  it('"Todas" lists every booking of every date, cancelled left out', async () => {
    respondWith([])
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json({
          items: [
            todayBookingDto({ id: 2, status: 'PENDING', user: { name: 'Marc Soler' } }),
            todayBookingDto({ id: 3, status: 'CANCELLED', user: { name: 'Ana Roca' } }),
          ],
          total: 2,
          page: 1,
          size: 100,
        }),
      ),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: es.staff.filterAll }))

    expect(await screen.findByText('Marc Soler')).toBeInTheDocument()
    expect(screen.queryByText('Ana Roca')).not.toBeInTheDocument()
  })

  it('says so when the chosen view is empty', async () => {
    respondWith([todayBookingDto({ id: 1 })])
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 100 }),
      ),
    )
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: es.staff.statuses.IN_PROGRESS }),
    )

    expect(await screen.findByText(es.staff.emptyFilter)).toBeInTheDocument()
  })
})
