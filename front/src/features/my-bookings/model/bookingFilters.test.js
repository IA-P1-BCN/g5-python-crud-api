import { describe, expect, it } from 'vitest'
import { filterBookings } from './bookingFilters.js'

// "Today" is fixed so the tests never depend on the real clock.
const NOW = new Date('2026-10-16T12:00:00Z')

const booking = (id, status, startsAt) => ({
  id,
  status,
  time_slot: { starts_at: startsAt },
})

const future = booking(1, 'CONFIRMED', '2026-10-20T16:00:00Z')
const earlierToday = booking(2, 'PENDING', '2026-10-16T09:00:00Z')
const past = booking(3, 'COMPLETED', '2026-10-10T16:00:00Z')
const cancelled = booking(4, 'CANCELLED', '2026-10-25T16:00:00Z')
const all = [future, earlierToday, past, cancelled]

describe('filterBookings', () => {
  it('upcoming: from today on, cancelled excluded', () => {
    expect(filterBookings(all, 'upcoming', NOW)).toEqual([future, earlierToday])
  })

  it('past: before today, cancelled excluded', () => {
    expect(filterBookings(all, 'past', NOW)).toEqual([past])
  })

  it('cancelled: only CANCELLED, whatever the date', () => {
    expect(filterBookings(all, 'cancelled', NOW)).toEqual([cancelled])
  })

  it('all: everything', () => {
    expect(filterBookings(all, 'all', NOW)).toEqual(all)
  })
})
