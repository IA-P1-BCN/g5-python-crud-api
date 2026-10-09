import { describe, expect, it } from 'vitest'
import { getVisibleRooms } from './visibleRooms.js'

const room = (slug, overrides = {}) => ({
  slug,
  isActive: true,
  hasUpcomingSlots: true,
  ...overrides,
})

describe('getVisibleRooms (BR-R4, BR-R6)', () => {
  it('keeps active rooms that have upcoming slots', () => {
    const rooms = [room('faro'), room('relojero')]
    expect(getVisibleRooms(rooms)).toEqual(rooms)
  })

  it('hides inactive rooms', () => {
    expect(getVisibleRooms([room('lab', { isActive: false })])).toEqual([])
  })

  it('hides active rooms without upcoming slots (new room, no slots yet)', () => {
    expect(getVisibleRooms([room('nueva', { hasUpcomingSlots: false })])).toEqual([])
  })

  it('keeps the original order', () => {
    const rooms = [room('b'), room('x', { isActive: false }), room('a')]
    expect(getVisibleRooms(rooms).map((r) => r.slug)).toEqual(['b', 'a'])
  })

  it('returns an empty list for an empty list', () => {
    expect(getVisibleRooms([])).toEqual([])
  })
})
