import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { adminRoomsHandlers, resetMockRooms, seedMockRooms } from '@/test/mocks/handlers/adminRooms'
import { server } from '@/test/mocks/server'
import { MemoryRouter } from 'react-router-dom'
import AdminRoomsPage from './AdminRoomsPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminRoomsPage />
    </MemoryRouter>,
  )

// The shared server (test/setup.js) fails on any request without a handler.
// server.use() puts the admin handlers before booking's GET /rooms.
beforeEach(() => {
  resetMockRooms()
  server.use(...adminRoomsHandlers)
})

const openForm = (user) => user.click(screen.getByRole('button', { name: /crear nueva sala/i }))

const fillRoom = async (user, { slug = 'new-adventure', name = 'New Adventure Room' } = {}) => {
  await openForm(user)
  await user.type(screen.getByLabelText(/slug/i), slug)
  await user.type(screen.getByLabelText(/^nombre/i), name)
  await user.type(screen.getByLabelText(/género/i), 'Sci-Fi')
  await user.type(screen.getByLabelText(/hook/i), 'Exciting hook')
  await user.type(screen.getByLabelText(/historia/i), 'Long story here')
  await user.type(screen.getByLabelText(/público/i), 'All audiences')
}
const save = (user) => user.click(screen.getByRole('button', { name: /guardar sala/i }))

describe('AdminRoomsPage', () => {
  it('lists the rooms from the paginated API', async () => {
    renderPage()
    expect(await screen.findByText('Sala de Prueba')).toBeInTheDocument()
  })

  it('shows a field error when the form is submitted empty', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await openForm(user)
    await save(user)
    expect(await screen.findByText(/el slug es obligatorio/i)).toBeInTheDocument()
  })

  it('shows a field error under an empty capacity (no silent 0)', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user)
    await user.clear(screen.getByLabelText(/capacidad/i))
    await save(user)
    expect(await screen.findByText(/la capacidad es obligatoria/i)).toBeInTheDocument()
  })

  it('shows the difficulty error under its field', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user)
    await user.clear(screen.getByLabelText(/dificultad/i))
    await user.type(screen.getByLabelText(/dificultad/i), '9')
    await save(user)
    expect(await screen.findByText(/dificultad debe estar entre 1 y 5/i)).toBeInTheDocument()
  })

  it('creates a room, clears the form and sends numbers', async () => {
    let sent
    server.use(
      http.post('/api/v1/rooms', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ id: 9, is_active: true, ...sent }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user)
    await save(user)
    expect(await screen.findByText(/los clientes la verán solo cuando/i)).toBeInTheDocument()
    expect(sent).toMatchObject({ slug: 'new-adventure', capacity: 4, duration: 60 })
    expect(screen.queryByLabelText(/slug/i)).not.toBeInTheDocument()
  })

  it('shows the duplicate slug error from the API', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user, { slug: 'slug-duplicado' })
    await save(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(/este slug ya existe/i)
  })

  it('shows a message when the API answers 500 on save', async () => {
    server.use(
      http.post('/api/v1/rooms', () =>
        HttpResponse.json({ detail: 'x', code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user)
    await save(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se ha podido completar/i)
  })

  it('shows the API message when the API answers 422 on save', async () => {
    server.use(
      http.post('/api/v1/rooms', () =>
        HttpResponse.json({ detail: 'x', code: 'VALIDATION_ERROR' }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sala de Prueba')
    await fillRoom(user)
    await save(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(/algún dato no es válido/i)
  })

  it('deactivates a room with PUT /rooms/:id/deactivate and then offers to activate it', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /^desactivar$/i }))
    const row = screen.getByText('Sala de Prueba').closest('tr')
    expect(await within(row).findByRole('button', { name: /^activar$/i })).toBeInTheDocument()
    expect(within(row).getByText('Inactiva')).toBeInTheDocument()
  })

  it('shows the error when a toggle fails', async () => {
    server.use(
      http.put('/api/v1/rooms/:id/deactivate', () =>
        HttpResponse.json({ detail: 'x', code: 'ROOM_HAS_BOOKINGS' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /^desactivar$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/tiene reservas/i)
  })

  it('shows a Spanish message when the list fails to load', async () => {
    server.use(
      http.get('/api/v1/rooms', () =>
        HttpResponse.json({ detail: 'x', code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se ha podido completar/i)
  })

  it('paginates: more than one page of rooms shows the second page', async () => {
    seedMockRooms(
      Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        slug: `sala-${i + 1}`,
        name: `Sala ${i + 1}`,
        genre: 'x',
        is_active: true,
      })),
    )
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText('Sala 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(await screen.findByText('Sala 21')).toBeInTheDocument()
  })
})
