import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import es from '@/i18n/es.js'
import Toast from './Toast.jsx'

describe('Toast', () => {
  it('shows its message as a polite status', () => {
    render(<Toast>Reserva confirmada</Toast>)
    expect(screen.getByRole('status')).toHaveTextContent('Reserva confirmada')
  })

  it('announces errors immediately with role alert', () => {
    render(<Toast tone="error">Ese horario ya está ocupado</Toast>)
    expect(screen.getByRole('alert')).toHaveTextContent('Ese horario ya está ocupado')
  })

  it('has no close button without onClose', () => {
    render(<Toast>Hola</Toast>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onClose from a labelled close button', async () => {
    const onClose = vi.fn()
    render(<Toast onClose={onClose}>Hola</Toast>)
    await userEvent.click(screen.getByRole('button', { name: es.common.close }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
