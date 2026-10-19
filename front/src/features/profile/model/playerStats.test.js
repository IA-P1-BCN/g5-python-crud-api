import { describe, expect, it } from 'vitest'
import { computePlayerStats } from './playerStats.js'

const game = (completed, completion_time) => ({ result: { completed, completion_time } })

describe('computePlayerStats', () => {
  it('returns 0 / 0 / "-" when there is no finished game', () => {
    expect(computePlayerStats([])).toEqual({ played: 0, escaped: 0, bestTime: '-' })
  })

  it('counts games and escaped games', () => {
    const stats = computePlayerStats([game(true, 2710), game(false, 3600), game(true, 1800)])
    expect(stats.played).toBe(3)
    expect(stats.escaped).toBe(2)
  })

  it('takes the best time among escaped games only, formatted mm:ss', () => {
    const stats = computePlayerStats([game(true, 2710), game(false, 600), game(true, 1805)])
    expect(stats.bestTime).toBe('30:05')
  })

  it('shows "-" when games exist but none was escaped (no Infinity)', () => {
    expect(computePlayerStats([game(false, 3600)]).bestTime).toBe('-')
  })

  it('ignores a game with no result yet', () => {
    const stats = computePlayerStats([{ result: null }, game(true, 65)])
    expect(stats).toEqual({ played: 2, escaped: 1, bestTime: '01:05' })
  })
})
