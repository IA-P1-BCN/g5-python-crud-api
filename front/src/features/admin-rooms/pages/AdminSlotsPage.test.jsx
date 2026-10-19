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

  describe('generar franjas', () => {
    const fillGenerate = (v) => {
      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: v.from } })
      fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: v.to } })
      fireEvent.change(screen.getByLabelText('Primera hora de inicio'), {
        target: { value: v.first },
      })
      fireEvent.change(screen.getByLabelText('Última hora de inicio'), {
        target: { value: v.last },
      })
    }
    const generate = (user) => user.click(screen.getByRole('button', { name: 'Generar franjas' }))

    it('genera franjas, muestra los contadores y refresca la tabla', async () => {
      let sent
      server.use(
        http.post('/api/v1/rooms/:roomId/time-slots/generate', async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json({ created_count: 5, skipped_count: 2 })
        }),
      )
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2030-12-03', first: '09:00', last: '20:00' })
      await generate(user)

      expect(await screen.findByRole('status')).toHaveTextContent('5 creadas')
      expect(screen.getByRole('status')).toHaveTextContent('2 omitidas')
      expect(sent).toEqual({
        date_from: '2030-12-01',
        date_to: '2030-12-03',
        first_start: '09:00',
        last_start: '20:00',
      })
    })

    it('añade las franjas nuevas a la tabla', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2030-12-02', first: '09:00', last: '20:00' })
      await generate(user)

      await waitFor(() => expect(rows()).toHaveLength(5)) // header + 2 old + 2 new
    })

    it('muestra ROOM_INACTIVE', async () => {
      server.use(
        http.post('/api/v1/rooms/:roomId/time-slots/generate', () =>
          HttpResponse.json({ detail: 'x', code: 'ROOM_INACTIVE' }, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2030-12-03', first: '09:00', last: '20:00' })
      await generate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(/sala está inactiva/i)
    })

    it('muestra VALIDATION_ERROR del servidor', async () => {
      server.use(
        http.post('/api/v1/rooms/:roomId/time-slots/generate', () =>
          HttpResponse.json({ detail: 'x', code: 'VALIDATION_ERROR' }, { status: 422 }),
        ),
      )
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2030-12-03', first: '09:00', last: '20:00' })
      await generate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(/no son válidos/i)
    })

    it('un rango de más de 90 días da error de campo sin llamar a la API', async () => {
      let called = false
      server.use(
        http.post('/api/v1/rooms/:roomId/time-slots/generate', () => {
          called = true
          return HttpResponse.json({ created_count: 0, skipped_count: 0 })
        }),
      )
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2031-12-01', first: '09:00', last: '20:00' })
      await generate(user)

      expect(await screen.findByText(/no puede superar 90 días/i)).toBeInTheDocument()
      expect(called).toBe(false)
    })

    it('primera hora posterior a la última da error de campo sin llamar a la API', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      fillGenerate({ from: '2030-12-01', to: '2030-12-03', first: '21:00', last: '09:00' })
      await generate(user)

      expect(await screen.findByText(/no puede ser posterior a la última/i)).toBeInTheDocument()
    })

    it('campos vacíos dan error de campo', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('10:00')

      await generate(user)

      expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(4)
    })
  })
})
