import { Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { buildCorridorStructure } from './corridorStructure.js'

vi.mock('./labelTexture.js', async () => {
  const { Texture } = await import('three')
  return { createLabel: () => new Texture() }
})

describe('buildCorridorStructure', () => {
  it('sets a dark background and fog on the scene', () => {
    const scene = new Scene()

    buildCorridorStructure(scene)

    expect(scene.background).not.toBeNull()
    expect(scene.fog).not.toBeNull()
  })

  it('adds floor, ceiling, two walls, the exit sign and an ambient light', () => {
    const scene = new Scene()

    buildCorridorStructure(scene)

    expect(scene.children).toHaveLength(6)
  })

  it('returns the exit sign at the end of the corridor so it can be animated', () => {
    const scene = new Scene()

    const { exitSign } = buildCorridorStructure(scene)

    expect(scene.children).toContain(exitSign)
    expect(exitSign.position.z).toBe(-20)
    expect(exitSign.material.transparent).toBe(true)
  })
})
