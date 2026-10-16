import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import BookingTabs from './BookingTabs.jsx'

const t = es.myBookings.tabs

describe('BookingTabs', () => {
  it('shows the four tabs in order', () => {
    render(<BookingTabs tab="upcoming" onChange={() => {}} />)

    const names = screen.getAllByRole('button').map((b) => b.textContent)
    expect(names).toEqual([t.upcoming, t.past, t.cancelled, t.all])
  })

  it('marks only the current tab as pressed', () => {
    render(<BookingTabs tab="past" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: t.past })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: t.upcoming })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls onChange with the tab key when a tab is clicked', async () => {
    const onChange = vi.fn()
    render(<BookingTabs tab="upcoming" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: t.cancelled }))

    expect(onChange).toHaveBeenCalledWith('cancelled')
  })

  it('groups the buttons under an accessible name', () => {
    render(<BookingTabs tab="upcoming" onChange={() => {}} />)

    expect(screen.getByRole('group', { name: t.label })).toBeInTheDocument()
  })
})
