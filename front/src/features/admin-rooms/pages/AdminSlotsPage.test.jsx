import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { adminRoomsHandlers, resetMockSlots } from '@/test/mocks/handlers/adminRooms'
import { server } from '@/test/mocks/server'
import AdminSlotsPage from './AdminSlotsPage'

// Use the global MSW server (test/setup.js). A second server here made every POST run twice
// (the new slot appeared twice). server.use() puts the admin handlers before booking's
// GET /time-slots, and setup.js resets it after each test.
beforeEach(() => {
  resetMockSlots()
  server.use(...adminRoomsHandlers)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/salas/room-1/horarios']}>
      <Routes>
        <Route path="/admin/salas/:id/horarios" element={<AdminSlotsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// rows()[0] es la cabecera; [1] = franja 10:00-11:00 (disponible); [2] = 12:00-13:00 (bloqueada)
const rows = () => screen.getAllByRole('row')

function fillForm({ date, start, end }) {
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: end } })
}

async function openCreateAndSubmit(user, values) {
  await user.click(await screen.findByRole('button', { name: 'Crear franja' }))
  fillForm(values)
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
}

describe('AdminSlotsPage', () => {
  it('lista las franjas de la sala', async () => {
    renderPage()

    expect(await screen.findByText('10:00')).toBeInTheDocument()
    expect(rows()).toHaveLength(3)
    expect(within(rows()[1]).getByText('Disponible')).toBeInTheDocument()
    expect(within(rows()[2]).getByText('Bloqueada')).toBeInTheDocument()
  })

  it('crea una franja y aparece en la tabla', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await openCreateAndSubmit(user, { date: '2030-11-06', start: '14:00', end: '15:00' })

    expect(await screen.findByText('14:00')).toBeInTheDocument()
    expect(rows()).toHaveLength(4)
  })

  it('edita una franja', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await user.click(within(rows()[1]).getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '11:30' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('11:30')).toBeInTheDocument()
  })

  it('bloquea y desbloquea una franja', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await user.click(within(rows()[1]).getByRole('button', { name: 'Bloquear' }))
    expect(
      await within(rows()[1]).findByRole('button', { name: 'Desbloquear' }),
    ).toBeInTheDocument()
    expect(within(rows()[1]).getByText('Bloqueada')).toBeInTheDocument()

    await user.click(within(rows()[1]).getByRole('button', { name: 'Desbloquear' }))
    expect(await within(rows()[1]).findByRole('button', { name: 'Bloquear' })).toBeInTheDocument()
    expect(within(rows()[1]).getByText('Disponible')).toBeInTheDocument()
  })

  it('elimina una franja', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await user.click(within(rows()[1]).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(screen.queryByText('10:00')).not.toBeInTheDocument())
    expect(rows()).toHaveLength(2)
  })

  it('muestra el error SLOT_OVERLAP al crear una franja solapada', async () => {
    server.use(
      http.post('/api/v1/time-slots', () =>
        HttpResponse.json({ detail: 'Time slot overlaps', code: 'SLOT_OVERLAP' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await openCreateAndSubmit(user, { date: '2030-11-04', start: '10:30', end: '11:30' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/se solapa con otra existente/i)
  })

  it('muestra ROOM_INACTIVE al crear una franja en una sala inactiva', async () => {
    server.use(
      http.post('/api/v1/time-slots', () =>
        HttpResponse.json({ detail: 'Room inactive', code: 'ROOM_INACTIVE' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await openCreateAndSubmit(user, { date: '2030-11-06', start: '14:00', end: '15:00' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/sala está inactiva/i)
  })

  it('muestra NOT_FOUND si la franja ya no existe', async () => {
    server.use(
      http.delete('/api/v1/time-slots/:slotId', () =>
        HttpResponse.json({ detail: 'nope', code: 'NOT_FOUND' }, { status: 404 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await user.click(within(rows()[1]).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya no existe/i)
  })

  it('muestra el error de reserva activa al eliminar una franja reservada', async () => {
    server.use(
      http.delete('/api/v1/time-slots/:slotId', () =>
        HttpResponse.json(
          { detail: 'Time slot has an active booking', code: 'SLOT_TAKEN' },
          { status: 409 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('10:00')

    await user.click(within(rows()[1]).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/tiene una reserva/i)
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })
})
