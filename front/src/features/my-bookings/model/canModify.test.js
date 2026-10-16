import { describe, expect, it } from 'vitest'
import { canModify } from './canModify.js'

const NOW = new Date('2026-10-16T12:00:00Z')
const booking = (startsAt, status = 'CONFIRMED') => ({
  status,
  time_slot: { starts_at: startsAt },
})

describe('canModify (24h rule)', () => {
  it('is true when the slot starts in more than 24h', () => {
    expect(canModify(booking('2026-10-18T12:00:00Z'), NOW)).toBe(true)
  })

  it('is true at exactly 24h (24h or more, BR-B6)', () => {
    expect(canModify(booking('2026-10-17T12:00:00Z'), NOW)).toBe(true)
  })

  it('is false under 24h', () => {
    expect(canModify(booking('2026-10-17T11:59:00Z'), NOW)).toBe(false)
  })

  it('is false when the slot is already past', () => {
    expect(canModify(booking('2026-10-15T12:00:00Z'), NOW)).toBe(false)
  })

  it.each(['IN_PROGRESS', 'COMPLETED', 'CANCELLED'])('is false for status %s', (status) => {
    expect(canModify(booking('2026-10-30T12:00:00Z', status), NOW)).toBe(false)
  })

  it('is true for a PENDING booking far enough away', () => {
    expect(canModify(booking('2026-10-30T12:00:00Z', 'PENDING'), NOW)).toBe(true)
  })
})
