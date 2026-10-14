import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { BookingPage } from './BookingPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ roomId: '1' }) }
})

describe('BookingPage Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  it('debe mostrar estado de carga y renderizar los slots tras la respuesta exitosa', async () => {
    server.use(
      http.get('/api/v1/time-slots', () => {
        return HttpResponse.json({
          items: [
            { id: '1', starts_at: '2026-10-15T10:00:00Z', is_bookable: true },
            { id: '2', starts_at: '2026-10-15T11:00:00Z', is_bookable: false },
          ],
        })
      }),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/reservar/1']}>
          <Routes>
            <Route path="/reservar/:roomId" element={<BookingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText(/cargando horarios/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/cargando horarios/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('debe mostrar error si la API falla', async () => {
    server.use(
      http.get('/api/v1/time-slots', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/reservar/1']}>
          <Routes>
            <Route path="/reservar/:roomId" element={<BookingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument()
    })
  })
})
