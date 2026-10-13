import { Object3D, PerspectiveCamera } from 'three'
import { beforeEach, describe, expect, it } from 'vitest'
import { createCameraRig } from './cameraRig.js'

const still = { mouseX: 0, mouseY: 0, dragYaw: 0, dragPitch: 0 }

let camera
let rig

function runFor(seconds, params) {
  for (let t = 0; t < seconds; t += 0.05)
    rig.step({ dt: 0.05, elapsed: t, input: still, ...params })
}

function doorAt(side, z) {
  const door = new Object3D()
  door.userData = { side, z }
  return door
}

beforeEach(() => {
  camera = new PerspectiveCamera(62, 1.5, 0.1, 60)
  rig = createCameraRig(camera)
})

describe('createCameraRig', () => {
  it('looks down the corridor when nothing is chosen', () => {
    runFor(2)

    expect(camera.position.z).toBeCloseTo(0.4)
    expect(camera.position.y).toBeCloseTo(1.6, 1)
    expect(rig.turn).toBe(0)
  })

  it('walks up to the chosen door and turns to face it', () => {
    const door = doorAt(-1, -3)

    runFor(2, { chosenDoor: door })

    expect(rig.turn).toBeGreaterThan(0.985)
    expect(camera.position.z).toBeCloseTo(-3, 1)
    expect(camera.position.x).toBeGreaterThan(1) // moved away from the left wall
  })

  it('tightens the field of view on the chosen door', () => {
    runFor(0.1)
    const wide = camera.fov

    runFor(2, { chosenDoor: doorAt(1, -3) })

    expect(camera.fov).toBeLessThan(wide)
  })

  it('widens the vertical field of view on a narrow window', () => {
    runFor(0.1)
    const wide = camera.fov

    rig.fitAspect(0.5)
    runFor(0.1)

    expect(camera.fov).toBeGreaterThan(wide)
  })

  it('leans a little toward the hovered door', () => {
    runFor(1)
    const before = camera.rotation.y

    runFor(1, { hoverDoor: doorAt(-1, -3) })

    expect(camera.rotation.y).toBeGreaterThan(before) // turned toward the left
  })
})
