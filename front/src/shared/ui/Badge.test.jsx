import { render, screen } from '@testing-library/react'
import Badge from './Badge.jsx'

describe('Badge', () => {
  it('renders its text', () => {
    render(<Badge>Confirmada</Badge>)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })

  it('uses the neutral tone by default', () => {
    render(<Badge>Estado</Badge>)
    expect(screen.getByText('Estado')).toHaveClass('text-muted')
  })

  it.each([
    ['pending', 'text-pending'],
    ['confirmed', 'text-confirmed'],
    ['in-progress', 'text-in-progress'],
    ['done', 'text-done'],
    ['cancelled', 'text-cancelled'],
    ['error', 'text-error'],
  ])('uses the %s colour for the %s tone', (tone, colour) => {
    render(<Badge tone={tone}>Estado</Badge>)
    expect(screen.getByText('Estado')).toHaveClass(colour)
  })

  it('lets callers add classes', () => {
    render(<Badge className="ml-2">Estado</Badge>)
    expect(screen.getByText('Estado')).toHaveClass('ml-2')
  })
})
