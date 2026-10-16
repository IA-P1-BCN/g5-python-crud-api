// PlayersDial: only the numbers between min and max can be chosen (room min_players..capacity).
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PlayersDial } from './PlayersDial'

describe('PlayersDial', () => {
  it('offers only the numbers from min to max', () => {
    render(<PlayersDial value={3} min={2} max={5} onChange={() => {}} />)

    for (const n of [2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '6' })).not.toBeInTheDocument()
  })

  it('calls onChange with the number that was clicked', () => {
    const onChange = vi.fn()
    render(<PlayersDial value={3} min={2} max={5} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '4' }))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('marks the current value as pressed', () => {
    render(<PlayersDial value={3} min={2} max={5} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'false')
  })
})
