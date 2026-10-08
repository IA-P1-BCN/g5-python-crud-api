import { render, screen } from '@testing-library/react'
import Badge from './Badge.jsx'

describe('Badge', () => {
  it('renders its text', () => {
    render(<Badge>Confirmada</Badge>)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })

  it('uses the neutral tone by default', () => {
    render(<Badge>Pendiente</Badge>)
    expect(screen.getByText('Pendiente')).toHaveClass('text-zinc-300')
  })

  it.each([
    ['success', 'text-emerald-300'],
    ['warning', 'text-amber-300'],
    ['danger', 'text-red-300'],
  ])('uses a distinct colour for the %s tone', (tone, colour) => {
    render(<Badge tone={tone}>Estado</Badge>)
    expect(screen.getByText('Estado')).toHaveClass(colour)
  })

  it('lets callers add classes', () => {
    render(<Badge className="ml-2">Estado</Badge>)
    expect(screen.getByText('Estado')).toHaveClass('ml-2')
  })
})
