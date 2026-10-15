// Ensure that the buttons labeled with the days of the week are displayed on the screen and that pressing one of them announces the corresponding date.
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DayPicker } from './DayPicker'

describe('DayPicker component', () => {
  const mockDates = [
    { dateString: '2026-06-01', dayOfWeek: 'Lun', dayNumber: '01' },
    { dateString: '2026-06-02', dayOfWeek: 'Mar', dayNumber: '02' },
  ]

  it('renders available dates and triggers onSelectDate when clicked', () => {
    const handleSelectDate = vi.fn()

    render(
      <DayPicker selectedDate="2026-06-01" onSelectDate={handleSelectDate} dates={mockDates} />,
    )

    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Mar').closest('button'))
    expect(handleSelectDate).toHaveBeenCalledWith('2026-06-02')
  })
})
