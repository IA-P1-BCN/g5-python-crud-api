import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto, roomsPage } from '@/test/mocks/handlers/rooms.js'
import { server } from '@/test/mocks/server.js'
import RoomPage from './RoomPage.jsx'

const respondWithRoom = (slug, body, status = 200) =>
  server.use(http.get(`/api/v1/rooms/${slug}`, () => HttpResponse.json(body, { status })))

function renderPage(initialRoute) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/salas" element={<p>{es.rooms.corridorLabel}</p>} />
          <Route path="/salas/atraco" element={<p>room atraco</p>} />
          <Route path="/salas/:slug" element={<RoomPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RoomPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/time-slots', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 100 }),
      ),
      http.get('/api/v1/rooms', () => HttpResponse.json(roomsPage([]))),
    )
  })

  it('shows the details of an active room', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    renderPage('/salas/faro')

    expect(await screen.findByRole('heading', { name: 'Faro 1923' })).toBeInTheDocument()
  })

  it('draws the ambiance of the room behind its details', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    renderPage('/salas/faro')

    expect(await screen.findByTestId('atmosphere')).toHaveAttribute('data-room', 'faro')
  })

  it('shows "not found" for an inactive room (BR-R4)', async () => {
    respondWithRoom('lab', roomDto({ slug: 'lab', name: 'Laboratorio Zero', status: 'inactive' }))
    renderPage('/salas/lab')

    expect(await screen.findByText(es.rooms.notFound)).toBeInTheDocument()
  })

  it('shows "not found" for a 404 (unknown slug)', async () => {
    respondWithRoom('unknown', { code: 'NOT_FOUND' }, 404)
    renderPage('/salas/unknown')

    expect(await screen.findByText(es.rooms.notFound)).toBeInTheDocument()
  })

  it('shows an error, not "not found", when the API fails with a non-404', async () => {
    respondWithRoom('faro', { code: 'INTERNAL_ERROR' }, 500)
    renderPage('/salas/faro')

    expect(await screen.findByRole('alert')).toHaveTextContent(es.rooms.error)
    expect(screen.queryByText(es.rooms.notFound)).not.toBeInTheDocument()
  })

  it('links back to the corridor', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    renderPage('/salas/faro')

    await userEvent.click(await screen.findByRole('button', { name: es.rooms.backToCorridor }))

    expect(screen.getByText(es.rooms.corridorLabel)).toBeInTheDocument()
  })

  it('shows the facts of the room and the 3 booking steps on the same page', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    renderPage('/salas/faro')

    expect(await screen.findByText(/2-4 jugadores · 60 min/)).toBeInTheDocument()
    expect(screen.getByLabelText(es.rooms.difficulty(3))).toBeInTheDocument()
    expect(await screen.findByRole('group', { name: es.booking.selectDay })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: es.booking.selectPlayers })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: es.booking.continue })).toBeDisabled()
  })

  it('has chips to switch to another room', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    server.use(
      http.get('/api/v1/rooms', () =>
        HttpResponse.json(
          roomsPage([
            roomDto({ slug: 'faro', name: 'Faro 1923' }),
            roomDto({ id: 2, slug: 'atraco', name: 'Atraco' }),
          ]),
        ),
      ),
    )
    renderPage('/salas/faro')

    await userEvent.click(await screen.findByRole('button', { name: 'Atraco' }))

    expect(await screen.findByText('room atraco')).toBeInTheDocument()
  })
})
