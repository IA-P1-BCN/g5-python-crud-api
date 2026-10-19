import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
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
          <Route path="/salas/:slug" element={<RoomPage />} />
          <Route path="/reservar/:slug" element={<p>booking grid</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RoomPage', () => {
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

  it('has a Reservar button that goes to the booking page of the room', async () => {
    respondWithRoom('faro', roomDto({ slug: 'faro', name: 'Faro 1923' }))
    renderPage('/salas/faro')

    await userEvent.click(await screen.findByRole('button', { name: es.rooms.reserve }))

    expect(screen.getByText('booking grid')).toBeInTheDocument()
  })
})
