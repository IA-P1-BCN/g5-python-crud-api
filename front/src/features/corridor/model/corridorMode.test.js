import { describe, expect, it } from 'vitest'
import { getCorridorMode } from './corridorMode.js'

const capable = { hasWebGL: true, reducedMotion: false, smallScreen: false }

describe('getCorridorMode', () => {
  it('uses the 3D corridor when WebGL works, motion is allowed and the screen is large', () => {
    expect(getCorridorMode(capable)).toBe('3d')
  })

  it.each([
    ['WebGL is missing', { hasWebGL: false }],
    ['the user prefers reduced motion', { reducedMotion: true }],
    ['the screen is small', { smallScreen: true }],
  ])('falls back to the poster grid when %s', (_label, override) => {
    expect(getCorridorMode({ ...capable, ...override })).toBe('fallback')
  })

  it('falls back when every condition is against the 3D', () => {
    expect(getCorridorMode({ hasWebGL: false, reducedMotion: true, smallScreen: true })).toBe(
      'fallback',
    )
  })
})
