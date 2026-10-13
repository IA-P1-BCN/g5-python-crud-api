import { PointLight, Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { buildDoors } from './doorsBuilder.js'

vi.mock('./labelTexture.js', async () => {
  const { Texture } = await import('three')
  return { createLabel: () => new Texture() }
})

const faro = { id: 3, slug: 'faro', name: 'Faro 1923', accent: '#ff0000' }
const relojero = { id: 1, slug: 'relojero', name: 'El Relojero', accent: '#00ff00' }

describe('buildDoors', () => {
  it('returns one door per room, in the same order', () => {
    const doors = buildDoors(new Scene(), [faro, relojero])

    expect(doors.map((d) => d.userData.room)).toEqual([faro, relojero])
  })

  it('alternates the doors between the left and the right wall', () => {
    const doors = buildDoors(new Scene(), [faro, relojero])

    expect(doors.map((d) => d.userData.side)).toEqual([-1, 1])
  })

  it('gives each door its own accent-coloured light, added to the scene', () => {
    const scene = new Scene()

    const doors = buildDoors(scene, [faro, relojero])

    const lights = scene.children.filter((c) => c instanceof PointLight)
    expect(lights).toHaveLength(2)
    expect(doors[0].userData.light).toBe(lights[0])
    expect(doors[0].userData.light.color.getHexString()).toBe('ff0000')
  })

  it('exposes the material the animation loop makes glow', () => {
    const [door] = buildDoors(new Scene(), [faro])

    expect(door.userData.material).toBe(door.material)
    expect(door.userData.material.emissive.getHexString()).toBe('ff0000')
  })

  it('adds nothing but the lights when there are no rooms', () => {
    const scene = new Scene()

    expect(buildDoors(scene, [])).toEqual([])
    expect(scene.children).toHaveLength(0)
  })
})
