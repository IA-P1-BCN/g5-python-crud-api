import { render, screen } from '@testing-library/react'
import Spinner from './Spinner.jsx'

describe('Spinner', () => {
  it('is announced as a status with its label', () => {
    render(<Spinner label="Cargando" />)
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
  })

  it('is hidden from screen readers when it has no label (decoration inside a button)', () => {
    const { container } = render(<Spinner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
