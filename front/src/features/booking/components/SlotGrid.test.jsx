// Verify that the grid renders correctly, disables unavailable time slots, and responds only when you click on available options.
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SlotGrid } from './SlotGrid'

describe('SlotGrid component', () => {
  const mockSlots = [
    { id: '1', time: '10:00', state: 'past' },
    { id: '2', time: '11:00', state: 'blocked' },
    { id: '3', time: '12:00', state: 'free' },
    { id: '4', time: '13:00', state: 'taken' },
  ]

  it('renders slots with free, taken, blocked and past states correctly', () => {
    render(<SlotGrid slots={mockSlots} selectedSlot={null} onSelectSlot={() => {}} />)

    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('13:00')).toBeInTheDocument()

    expect(screen.getByText('10:00').closest('button')).toBeDisabled()
    expect(screen.getByText('11:00').closest('button')).toBeDisabled()
    expect(screen.getByText('13:00').closest('button')).toBeDisabled()

    expect(screen.getByText('12:00').closest('button')).not.toBeDisabled()
  })

  it('allows clicking only on free slots and triggers selection callback', () => {
    const handleSelect = vi.fn()
    render(<SlotGrid slots={mockSlots} selectedSlot={null} onSelectSlot={handleSelect} />)

    fireEvent.click(screen.getByText('11:00'))
    expect(handleSelect).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('12:00'))
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(mockSlots[2])
  })
})
