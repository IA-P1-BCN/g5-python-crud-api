import { render, screen } from '@testing-library/react'
import Alert from './Alert.jsx'

describe('Alert', () => {
  it('renders its message', () => {
    render(<Alert>No se pudo guardar</Alert>)
    expect(screen.getByText('No se pudo guardar')).toBeInTheDocument()
  })

  it('errors are announced immediately (role=alert)', () => {
    render(<Alert tone="error">Ese horario ya está ocupado</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Ese horario ya está ocupado')
  })

  it.each(['success', 'info'])('%s is announced politely (role=status)', (tone) => {
    render(<Alert tone={tone}>Reserva confirmada</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Reserva confirmada')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['error', 'border-error'],
    ['success', 'border-confirmed'],
    ['info', 'border-in-progress'],
  ])('%s tone has its own border colour', (tone, border) => {
    render(<Alert tone={tone}>Mensaje</Alert>)
    expect(screen.getByText('Mensaje')).toHaveClass(border)
  })

  it('lets callers add classes', () => {
    render(<Alert className="mt-4">Mensaje</Alert>)
    expect(screen.getByText('Mensaje')).toHaveClass('mt-4')
  })
})
