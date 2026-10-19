import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto, roomsPage } from '@/test/mocks/handlers/rooms.js'
import { server } from '@/test/mocks/server.js'
import { useGateStore } from '../model/gate.store.js'
import RoomsPage from './RoomsPage.jsx'

// The 3D corridor is tested in its own feature: a stub that enters the first room is enough.
vi.mock('@/features/corridor', async () => {
  const { createElement } = await import('react')
  return {
    CorridorView: ({ rooms, onEnter, listBelow }) =>
      createElement(
        'button',
        { 'data-list-below': String(listBelow), onClick: () => onEnter(rooms[0]) },
        'corridor-stub',
      ),
  }
})

const respondWithRooms = (body, status = 200) =>
  server.use(http.get('/api/v1/rooms', () => HttpResponse.json(body, { status })))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/salas']}>
        <Routes>
          <Route path="/salas" element={<RoomsPage />} />
          <Route path="/salas/:slug" element={<p>room detail</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => useGateStore.getState().reset())

describe('RoomsPage', () => {
  it('shows a loading status while the rooms are fetched', () => {
    respondWithRooms(roomsPage([roomDto()]))
    renderPage()

    expect(screen.getByRole('status', { name: es.rooms.loading })).toBeInTheDocument()
  })

  it('lists the rooms visible to clients (BR-R4, BR-R6)', async () => {
    respondWithRooms(
      roomsPage([
        roomDto({ id: 1, slug: 'faro', name: 'Faro 1923' }),
        roomDto({ id: 2, slug: 'lab', name: 'Laboratorio Zero', status: 'inactive' }),
        roomDto({ id: 3, slug: 'nueva', name: 'Sala Nueva', has_upcoming_slots: false }),
      ]),
    )
    renderPage()

    expect(await screen.findByText('Faro 1923')).toBeInTheDocument()
    expect(screen.queryByText('Laboratorio Zero')).not.toBeInTheDocument()
    expect(screen.queryByText('Sala Nueva')).not.toBeInTheDocument()
  })

  it('links each room to its detail page', async () => {
    respondWithRooms(roomsPage([roomDto({ id: 1, slug: 'faro', name: 'Faro 1923' })]))
    renderPage()

    expect(await screen.findByRole('button', { name: es.rooms.viewDetails })).toBeInTheDocument()
  })

  it('shows an empty state when no room is visible', async () => {
    respondWithRooms(roomsPage([]))
    renderPage()

    expect(await screen.findByText(es.rooms.empty)).toBeInTheDocument()
  })

  it('shows an error when the API fails', async () => {
    respondWithRooms({ code: 'INTERNAL_ERROR' }, 500)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.rooms.error)
  })
})

describe('RoomsPage, entering a room', () => {
  it('starts the gate with the chosen room (GateLayer does the rest)', async () => {
    respondWithRooms(roomsPage([roomDto({ id: 1, slug: 'faro', name: 'Faro 1923' })]))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: es.rooms.viewDetails }))

    expect(useGateStore.getState()).toMatchObject({ room: { slug: 'faro' }, phase: 'cover' })
  })

  it('shows the welcome, the corridor and the rooms section (FR-17)', async () => {
    respondWithRooms(roomsPage([roomDto({ id: 1, slug: 'faro', name: 'Faro 1923' })]))
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: es.rooms.welcome })).toBeVisible()
    expect(screen.getByText(es.rooms.tagline)).toBeVisible()
    const corridor = screen.getByRole('button', { name: 'corridor-stub' })
    expect(corridor).toHaveAttribute('data-list-below', 'true')
    expect(screen.getByRole('heading', { level: 2, name: es.rooms.sectionTitle })).toBeVisible()
  })

  it('starts the gate when a door of the corridor is clicked', async () => {
    respondWithRooms(roomsPage([roomDto({ id: 1, slug: 'faro', name: 'Faro 1923' })]))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'corridor-stub' }))

    expect(useGateStore.getState()).toMatchObject({ room: { slug: 'faro' }, phase: 'cover' })
  })
})
