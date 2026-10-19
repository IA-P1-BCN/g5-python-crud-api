/* global process -- Node API, only used to pin the time zone of this test */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import BookingCard from './BookingCard.jsx'

const t = es.myBookings.card

// Dates are shown in the local zone: pin it so the tests give the same result on every computer.
// Node reads TZ at each date operation, so setting it here is enough.
const previousTz = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Europe/Madrid'
})
afterAll(() => {
  if (previousTz === undefined) delete process.env.TZ
  else process.env.TZ = previousTz
})

describe('BookingCard', () => {
  it('shows room, date, time, players and total price', () => {
    render(<BookingCard booking={bookingDto()} />)

    expect(screen.getByText('Faro 1923')).toBeInTheDocument()
    expect(screen.getByText(/20 de octubre de 2026/)).toBeInTheDocument()
    expect(screen.getByText(/18:00/)).toBeInTheDocument()
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

describe('BookingCard time zone', () => {
  it('shows the local time: 10:00Z is 12:00 in Madrid (CEST)', () => {
    const slot = { ...bookingDto().time_slot, starts_at: '2026-10-20T10:00:00Z' }
    render(<BookingCard booking={bookingDto({ time_slot: slot })} />)

    expect(screen.getByText(/12:00/)).toBeInTheDocument()
  })
})

describe('BookingCard actions', () => {
  const slot = (startsAt) => ({ ...bookingDto().time_slot, starts_at: startsAt })
  const FUTURE = bookingDto({ time_slot: slot('2026-10-30T16:00:00Z') })
  const SOON = bookingDto({ time_slot: slot('2026-10-17T10:00:00Z') })

  // Only Date is faked, so "now" is fixed for the 24h rule.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('calls onModify / onCancel from the enabled buttons', async () => {
    const onModify = vi.fn()
    const onCancel = vi.fn()
    render(<BookingCard booking={FUTURE} onModify={onModify} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: es.myBookings.actions.modify }))
    await userEvent.click(screen.getByRole('button', { name: es.myBookings.actions.cancel }))

    expect(onModify).toHaveBeenCalledWith(FUTURE)
    expect(onCancel).toHaveBeenCalledWith(FUTURE)
  })

  it('calls onChangeSlot from the enabled change-slot button', async () => {
    const onChangeSlot = vi.fn()
    render(<BookingCard booking={FUTURE} onChangeSlot={onChangeSlot} />)

    await userEvent.click(screen.getByRole('button', { name: es.myBookings.actions.changeSlot }))

    expect(onChangeSlot).toHaveBeenCalledWith(FUTURE)
  })

  it('disables all the buttons and explains why under 24h', () => {
    render(<BookingCard booking={SOON} onModify={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('button', { name: es.myBookings.actions.modify })).toBeDisabled()
    expect(screen.getByRole('button', { name: es.myBookings.actions.changeSlot })).toBeDisabled()
    expect(screen.getByRole('button', { name: es.myBookings.actions.cancel })).toBeDisabled()
    expect(screen.getByText(es.myBookings.actions.tooLate)).toBeInTheDocument()
  })

  it('shows no actions for a cancelled booking', () => {
    render(<BookingCard booking={{ ...FUTURE, status: 'CANCELLED' }} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
