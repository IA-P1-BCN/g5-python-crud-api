import { describe, expect, it } from 'vitest'
import { clamp, lerp, smoothstep } from './math.js'

describe('math', () => {
  it('clamp keeps a value inside the range', () => {
    expect([clamp(5, 0, 1), clamp(-5, 0, 1), clamp(0.4, 0, 1)]).toEqual([1, 0, 0.4])
  })

  it('smoothstep goes from 0 to 1 and is 0.5 in the middle', () => {
    expect([smoothstep(0), smoothstep(0.5), smoothstep(1)]).toEqual([0, 0.5, 1])
  })

  it('lerp moves a value a fraction of the way to its target', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5)
    expect(lerp(4, 4, 0.9)).toBe(4)
    expect(lerp(2, 8, 1)).toBe(8)
  })
})
