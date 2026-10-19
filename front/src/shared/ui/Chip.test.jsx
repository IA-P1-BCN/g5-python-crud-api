import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chip from './Chip.jsx'

describe('Chip', () => {
  it('is an unpressed toggle button by default', () => {
    render(<Chip>Próximas</Chip>)
    const chip = screen.getByRole('button', { name: 'Próximas' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(chip).toHaveAttribute('type', 'button')
  })

  it('announces itself as pressed when selected', () => {
    render(<Chip selected>Próximas</Chip>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Chip onClick={onClick}>Próximas</Chip>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps a 44px touch target', () => {
    render(<Chip>Próximas</Chip>)
    expect(screen.getByRole('button')).toHaveClass('min-h-11')
  })
})
