import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button.jsx'

describe('Button', () => {
  it('renders its children as a button that does not submit forms by default', () => {
    render(<Button>Reservar</Button>)
    expect(screen.getByRole('button', { name: 'Reservar' })).toHaveAttribute('type', 'button')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Reservar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Reservar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is disabled and busy while loading (no double submit)', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Reservar
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows a spinner only while loading', () => {
    const { rerender } = render(<Button>Reservar</Button>)
    expect(screen.getByRole('button').querySelector('[data-slot="spinner"]')).toBeNull()
    rerender(<Button loading>Reservar</Button>)
    expect(screen.getByRole('button').querySelector('[data-slot="spinner"]')).not.toBeNull()
  })

  it('primary is the site CTA: exit green with dark text and glow', () => {
    render(<Button>Reservar</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-exit', 'text-on-exit', 'shadow-glow')
    expect(button).not.toHaveClass('bg-room')
  })

  it('room variant uses the room accent; ghost has no solid background', () => {
    render(
      <>
        <Button variant="room">Room</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Room' })).toHaveClass('bg-room')
    expect(screen.getByRole('button', { name: 'Ghost' })).not.toHaveClass('bg-room', 'bg-exit')
  })

  it('keeps a 44px touch target and lets callers add or override classes', () => {
    render(<Button className="min-h-14 w-full">Reservar</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
    expect(button).toHaveClass('min-h-14')
    expect(button).not.toHaveClass('min-h-11')
  })
})
