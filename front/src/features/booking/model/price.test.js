// Unit tests for the booking price (BR-B4: total = price per player x players).
import { describe, it, expect } from 'vitest'
import { computeTotalPrice } from './price'

describe('computeTotalPrice', () => {
  it('multiplies the price per player by the number of players', () => {
    expect(computeTotalPrice({ pricePerPlayer: 15, players: 4 })).toBe(60)
  })

  it('handles a price with cents without floating point noise', () => {
    // 0.1 + 0.2 style bug: 12.1 * 3 is 36.300000000000004 in JavaScript
    expect(computeTotalPrice({ pricePerPlayer: 12.1, players: 3 })).toBe(36.3)
  })

  it('returns 0 for a free room', () => {
    expect(computeTotalPrice({ pricePerPlayer: 0, players: 5 })).toBe(0)
  })
})
