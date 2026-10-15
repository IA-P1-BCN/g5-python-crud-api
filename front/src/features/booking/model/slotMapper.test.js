import { describe, expect, it } from 'vitest'
import { toSlot } from './slotMapper.js'

describe('toSlot', () => {
  it.each(['free', 'taken', 'blocked', 'past'])('keeps the %s state sent by the API', (state) => {
    const slot = toSlot({ id: 1, starts_at: '2030-01-01T10:00:00Z', state })

    expect(slot).toMatchObject({ id: 1, state })
  })
})
