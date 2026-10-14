// A pure unit test that verifies the `isSlotSelectable` function across all four states.
import { describe, it, expect } from 'vitest'
import { SLOT_STATES, isSlotSelectable } from './slotState'

describe('slotState domain logic', () => {
  it('should identify FREE slots as selectable', () => {
    expect(isSlotSelectable(SLOT_STATES.FREE)).toBe(true)
  })

  it('should identify TAKEN, BLOCKED, and PAST slots as non-selectable', () => {
    expect(isSlotSelectable(SLOT_STATES.TAKEN)).toBe(false)
    expect(isSlotSelectable(SLOT_STATES.BLOCKED)).toBe(false)
    expect(isSlotSelectable(SLOT_STATES.PAST)).toBe(false)
  })
})