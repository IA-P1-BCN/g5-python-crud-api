import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RoomsPage from './RoomsPage'
import { roomsHandlers } from '@/test/mocks/handlers/rooms'

const server = setupServer(...roomsHandlers)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => server.close())

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RoomsPage', () => {
  test('muestra estado de carga inicialmente', () => {
    renderWithProviders(<RoomsPage />)
    expect(screen.getByRole('status') || screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  test('lista las salas activas y muestra el aviso de sala completa', async () => {
    renderWithProviders(<RoomsPage />)

    expect(await screen.findByText('Alfa')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    
    expect(screen.queryByText('Inactiva')).not.toBeInTheDocument()

    expect(screen.getByText(/completa/i)).toBeInTheDocument()
  })

  test('muestra estado de error cuando falla la API', async () => {
    server.use(
      http.get('/api/v1/rooms', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    renderWithProviders(<RoomsPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})