import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { initialState, transition } from '../model/doorMachine.js'
import { getArrivalEvent, getHoverEvent } from '../model/frameEvents.js'
import { createCameraRig } from './cameraRig.js'
import { buildCorridorStructure } from './corridorStructure.js'
import { buildDoors, IDLE_EMISSIVE, IDLE_LIGHT } from './doorsBuilder.js'
import { lerp } from './math.js'
import { createPointerInput } from './pointerInput.js'

const MAX_PIXEL_RATIO = 2
const GLOW = { idle: [IDLE_EMISSIVE, IDLE_LIGHT], active: [1.6, 2.6] } // [door emissive, door light]

const GLOW_EASE = 0.12 // fraction of the way to the target glow, per frame

// createCorridor(container, { rooms, onEnter }) -> { dispose }
// rooms: [{ id, slug, name, accent }]. Calls onEnter(room) once the camera faces the chosen door.
export function createCorridor(container, { rooms, onEnter }) {
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'pan-y',
  })
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(62, 1, 0.1, 60)
  const { exitSign } = buildCorridorStructure(scene)
  const doors = buildDoors(scene, rooms)
  const rig = createCameraRig(camera)

  // The door machine decides what is hovered / selected / entered.
  let state = initialState
  const dispatch = (event) => {
    state = transition(state, event)
    canvas.style.cursor = state.status === 'idle' ? '' : 'pointer'
  }
  const isChoosing = () => state.status === 'idle' || state.status === 'hover'
  const doorOf = (id) => doors.find((d) => d.userData.room.id === id)
  const pointer = createPointerInput(canvas, { camera, doors, dispatch, isChoosing })

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    rig.fitAspect(camera.aspect)
    camera.updateProjectionMatrix()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  const startTime = performance.now()
  let lastTime = startTime
  let frame

  const loop = (now) => {
    frame = requestAnimationFrame(loop)
    const elapsed = (now - startTime) / 1000
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now

    const hoverEvent = getHoverEvent(state, pointer.pickDoor()?.userData.room.id ?? null, () =>
      pointer.isNearDoor(doorOf(state.doorId)),
    )
    if (hoverEvent) dispatch(hoverEvent)

    const chosenDoor = isChoosing() ? null : doorOf(state.doorId)
    const hoverDoor = state.status === 'hover' ? doorOf(state.doorId) : null
    rig.step({ dt, elapsed, input: pointer.input, hoverDoor, chosenDoor })

    const arrivalEvent = getArrivalEvent(state, rig.turn)
    if (arrivalEvent) {
      dispatch(arrivalEvent)
      onEnter(chosenDoor.userData.room)
    }

    for (const door of doors) {
      const { material, light, room } = door.userData
      const [emissive, intensity] =
        state.status !== 'idle' && state.doorId === room.id ? GLOW.active : GLOW.idle
      material.emissiveIntensity = lerp(material.emissiveIntensity, emissive, GLOW_EASE)
      light.intensity = lerp(light.intensity, intensity, GLOW_EASE)
    }
    exitSign.material.opacity = 0.7 + Math.sin(elapsed * 3) * 0.3
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(loop)

  return {
    dispose() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      pointer.dispose()
      scene.traverse((object) => {
        object.geometry?.dispose()
        object.material?.map?.dispose()
        object.material?.dispose()
      })
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
