import { describe, expect, it } from 'vitest'
import { getDoorPlacement } from './doorPlacement.js'

describe('getDoorPlacement', () => {
  it('puts the first door on the left wall, facing the corridor', () => {
    expect(getDoorPlacement(0)).toEqual({ side: -1, x: -2.95, z: -3, ry: Math.PI / 2 })
  })

  it('puts the second door on the right wall, facing the first one', () => {
    expect(getDoorPlacement(1)).toEqual({ side: 1, x: 2.95, z: -3, ry: -Math.PI / 2 })
  })

  it('moves one pair of doors deeper every two rooms (5.5 m)', () => {
    expect(getDoorPlacement(2).z).toBe(-8.5)
    expect(getDoorPlacement(3).z).toBe(-8.5)
    expect(getDoorPlacement(4).z).toBe(-14)
  })

  it('alternates left and right', () => {
    expect([0, 1, 2, 3].map((i) => getDoorPlacement(i).side)).toEqual([-1, 1, -1, 1])
  })
})
