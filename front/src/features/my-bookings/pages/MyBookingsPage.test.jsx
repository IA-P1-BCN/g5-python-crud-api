import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto, bookingsPage, meHandler } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import MyBookingsPage from './MyBookingsPage.jsx'

const t = es.myBookings

// Only Date is faked (so "today" is fixed); timers stay real for MSW and waitFor.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

const room = (name) => ({ id: 1, name, slug: 'x', capacity: 6, base_price: '20.00' })
const startsAt = (iso) => ({ id: 10, starts_at: iso, ends_at: iso, status: 'available' })

const upcoming = bookingDto({
  id: 1,
  room: room('Sala Futura'),
  time_slot: startsAt('2026-10-20T16:00:00Z'),
})
const past = bookingDto({
  id: 2,
  status: 'COMPLETED',
  room: room('Sala Pasada'),
  time_slot: startsAt('2026-10-10T16:00:00Z'),
})
const cancelled = bookingDto({
  id: 3,
  status: 'CANCELLED',
  room: room('Sala Cancelada'),
  time_slot: startsAt('2026-10-25T16:00:00Z'),
})

const respondWith = (items) =>
  server.use(
    meHandler(),
    http.get('/api/v1/bookings', () => HttpResponse.json(bookingsPage(items))),
  )

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MyBookingsPage />
    </QueryClientProvider>,
  )
}

describe('MyBookingsPage', () => {
  it('shows a loading status while the bookings are fetched', () => {
    respondWith([upcoming])
    renderPage()

    expect(screen.getByRole('status', { name: t.page.loading })).toBeInTheDocument()
  })

  it('shows the upcoming bookings by default', async () => {
    respondWith([upcoming, past, cancelled])
    renderPage()

    expect(await screen.findByText('Sala Futura')).toBeInTheDocument()
    expect(screen.queryByText('Sala Pasada')).not.toBeInTheDocument()
    expect(screen.queryByText('Sala Cancelada')).not.toBeInTheDocument()
  })

  it('switches the list when another tab is clicked', async () => {
    respondWith([upcoming, past, cancelled])
    renderPage()
    await screen.findByText('Sala Futura')

    await userEvent.click(screen.getByRole('button', { name: t.tabs.cancelled }))

    expect(screen.getByText('Sala Cancelada')).toBeInTheDocument()
    expect(screen.queryByText('Sala Futura')).not.toBeInTheDocument()
  })

  it('shows every booking on the "all" tab', async () => {
    respondWith([upcoming, past, cancelled])
    renderPage()
    await screen.findByText('Sala Futura')

    await userEvent.click(screen.getByRole('button', { name: t.tabs.all }))

    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('shows an empty state when the tab has no booking', async () => {
    respondWith([upcoming])
    renderPage()
    await screen.findByText('Sala Futura')

    await userEvent.click(screen.getByRole('button', { name: t.tabs.past }))

    expect(screen.getByText(t.page.empty)).toBeInTheDocument()
  })

  it('opens the change-slot dialog for the chosen booking', async () => {
    respondWith([upcoming])
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 100 }),
      ),
    )
    renderPage()
    await screen.findByText('Sala Futura')

    await userEvent.click(screen.getByRole('button', { name: t.actions.changeSlot }))

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      t.changeSlotDialog.description.replace('{room}', 'Sala Futura'),
    )
  })

  it('shows an error message when the API fails', async () => {
    server.use(
      http.get('/api/v1/bookings', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(t.page.loadError)
  })
})
