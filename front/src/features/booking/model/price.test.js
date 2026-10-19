import { describe, it, expect } from 'vitest'
import { computeTotalPrice } from './price'

describe('computeTotalPrice', () => {
  it('multiplies the price per player by the number of players', () => {
    expect(computeTotalPrice({ pricePerPlayer: 15, players: 4 })).toBe(60)
  })

  it('handles a price with cents without floating point noise', () => {
    expect(computeTotalPrice({ pricePerPlayer: 12.1, players: 3 })).toBe(36.3)
  })

  it('returns 0 for a free room', () => {
    expect(computeTotalPrice({ pricePerPlayer: 0, players: 5 })).toBe(0)
  })
})
