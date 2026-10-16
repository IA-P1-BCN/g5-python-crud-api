import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import BookingCard from './BookingCard.jsx'

const t = es.myBookings.card

describe('BookingCard', () => {
  it('shows room, date, time, players and total price', () => {
    render(<BookingCard booking={bookingDto()} />)

    expect(screen.getByText('Faro 1923')).toBeInTheDocument()
    expect(screen.getByText(/20 de octubre de 2026/)).toBeInTheDocument()
    expect(screen.getByText(/16:00/)).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText(/80,00/)).toBeInTheDocument()
  })

  it.each([
    ['PENDING', t.status.PENDING],
    ['CONFIRMED', t.status.CONFIRMED],
    ['IN_PROGRESS', t.status.IN_PROGRESS],
    ['COMPLETED', t.status.COMPLETED],
    ['CANCELLED', t.status.CANCELLED],
  ])('shows the %s status as "%s"', (status, label) => {
    render(<BookingCard booking={bookingDto({ status })} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
