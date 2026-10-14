import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RoomPage from './RoomPage'

const server = setupServer(
  http.get('/api/v1/rooms/sala-alfa', () => {
    return HttpResponse.json({
      id: '1',
      slug: 'sala-alfa',
      title: 'Alfa Detalle',
      is_active: true,
      has_upcoming_slots: true,
    })
  }),
  http.get('/api/v1/rooms/sala-inactiva', () => {
    return HttpResponse.json({
      id: '3',
      slug: 'sala-inactiva',
      title: 'Inactiva',
      is_active: false,
      has_upcoming_slots: true,
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const renderWithRouter = (initialRoute) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/salas/:slug" element={<RoomPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RoomPage', () => {
  test('muestra los detalles de una sala válida y activa', async () => {
    renderWithRouter('/salas/sala-alfa')

    expect(await screen.findByText('Alfa Detalle')).toBeInTheDocument()
  })

  test('muestra "sala no encontrada" para una sala desconocida o inactiva', async () => {
    renderWithRouter('/salas/sala-inactiva')

    expect(await screen.findByText(/sala no encontrada/i)).toBeInTheDocument()
  })

  test('muestra "sala no encontrada" ante un error 404', async () => {
    renderWithRouter('/salas/slug-inexistente')

    expect(await screen.findByText(/sala no encontrada/i)).toBeInTheDocument()
  })
})