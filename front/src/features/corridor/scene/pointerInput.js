import { Raycaster, Vector2, Vector3 } from 'three'
import { clamp } from './math.js'

const MAX_YAW = 1.25
const MAX_PITCH = 0.3
const DRAG_THRESHOLD = 6
const NEAR_X = 0.35 // how far (in screen units, -1..1) the pointer may drift from a hovered door
const NEAR_Y = 0.8
const NO_POINTER = 9 // out of the screen

// Pointer events on the canvas: hover/click on doors and drag to look around.
// `input` is a live object the camera rig reads every frame.
export function createPointerInput(canvas, { camera, doors, dispatch, isChoosing }) {
  const raycaster = new Raycaster()
  const mouse = new Vector2(NO_POINTER, NO_POINTER)
  const input = { mouseX: 0, mouseY: 0, dragYaw: 0, dragPitch: 0 }
  const doorScreen = new Vector3()
  let dragStart = null
  let dragDistance = 0

  const setPointer = (e) => {
    const box = canvas.getBoundingClientRect()
    mouse.set(
      ((e.clientX - box.left) / box.width) * 2 - 1,
      -((e.clientY - box.top) / box.height) * 2 + 1,
    )
  }
  const pickDoor = () => {
    raycaster.setFromCamera(mouse, camera)
    return raycaster.intersectObjects(doors)[0]?.object ?? null
  }
  // Keeps a hovered door while the pointer stays near it on screen (no flicker when the camera leans).
  const isNearDoor = (door) => {
    door.getWorldPosition(doorScreen)
    doorScreen.y = 1.3
    doorScreen.project(camera)
    return Math.abs(doorScreen.x - mouse.x) <= NEAR_X && Math.abs(doorScreen.y - mouse.y) <= NEAR_Y
  }

  const listeners = new AbortController()
  const on = (type, handler) => canvas.addEventListener(type, handler, { signal: listeners.signal })
  const endDrag = () => {
    dragStart = null
  }

  on('pointerdown', (e) => {
    setPointer(e)
    dragStart = { x: e.clientX, y: e.clientY }
    dragDistance = 0
    canvas.setPointerCapture(e.pointerId)
  })
  on('pointerup', endDrag)
  on('pointercancel', endDrag) // a touch scroll cancels the pointer
  on('pointermove', (e) => {
    setPointer(e)
    input.mouseX = mouse.x
    input.mouseY = mouse.y
    if (!dragStart || !isChoosing()) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    dragDistance += Math.abs(dx) + Math.abs(dy)
    input.dragYaw = clamp(input.dragYaw - dx * 0.004, -MAX_YAW, MAX_YAW)
    input.dragPitch = clamp(input.dragPitch + dy * 0.003, -MAX_PITCH, MAX_PITCH)
    dragStart = { x: e.clientX, y: e.clientY }
  })
  on('pointerleave', () => {
    mouse.set(NO_POINTER, NO_POINTER)
    input.mouseX = 0
    input.mouseY = 0
  })
  on('click', () => {
    if (dragDistance > DRAG_THRESHOLD || !isChoosing()) return
    const door = pickDoor()
    if (door) dispatch({ type: 'SELECT', doorId: door.userData.room.id })
  })

  return { input, pickDoor, isNearDoor, dispose: () => listeners.abort() }
}
