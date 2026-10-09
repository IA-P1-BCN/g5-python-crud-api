import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPointerInput } from './pointerInput.js'

let canvas
let camera
let door
let dispatch
let choosing
let pointer

const fire = (type, x = 50, y = 50) =>
  canvas.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y }))

beforeEach(() => {
  canvas = document.createElement('canvas')
  canvas.setPointerCapture = vi.fn()
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 })
  camera = new PerspectiveCamera(60, 1, 0.1, 50)
  camera.updateMatrixWorld()
  door = new Mesh(new BoxGeometry(2, 2, 0.1), new MeshBasicMaterial())
  door.position.set(0, 0, -5) // straight ahead of the camera = centre of the canvas
  door.updateMatrixWorld()
  door.userData = { room: { id: 7 } }
  dispatch = vi.fn()
  choosing = true
  pointer = createPointerInput(canvas, {
    camera,
    doors: [door],
    dispatch,
    isChoosing: () => choosing,
  })
})

describe('createPointerInput', () => {
  it('selects the door under the pointer on click', () => {
    fire('pointermove')
    fire('click')

    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT', doorId: 7 })
  })

  it('does not select anything when the click misses every door', () => {
    fire('pointermove', 0, 0)
    fire('click', 0, 0)

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('treats a click that ends a drag as a drag, not a selection', () => {
    fire('pointerdown')
    fire('pointermove', 80, 50)
    fire('pointerup')
    fire('click', 50, 50)

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('turns the view when dragging, clamped', () => {
    fire('pointerdown')
    fire('pointermove', 5000, 50)

    expect(pointer.input.dragYaw).toBeCloseTo(-1.25)
  })

  it('ignores clicks and drags once a door has been chosen', () => {
    choosing = false
    fire('pointermove')
    fire('click')
    fire('pointerdown')
    fire('pointermove', 90, 50)

    expect(dispatch).not.toHaveBeenCalled()
    expect(pointer.input.dragYaw).toBe(0)
  })

  it('stops dragging when the browser cancels the pointer (touch scroll)', () => {
    fire('pointerdown')
    fire('pointercancel')
    fire('pointermove', 90, 50)

    expect(pointer.input.dragYaw).toBe(0)
  })

  it('stops reacting to events once disposed', () => {
    pointer.dispose()

    fire('pointermove')
    fire('click')

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('finds the door under the pointer', () => {
    fire('pointermove')

    expect(pointer.pickDoor()).toBe(door)
  })

  it('knows when the pointer is still near a door on screen', () => {
    fire('pointermove')
    expect(pointer.isNearDoor(door)).toBe(true)

    fire('pointermove', 0, 0)
    expect(pointer.isNearDoor(door)).toBe(false)
  })
})
