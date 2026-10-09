import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  Fog,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { initialState, transition } from './doorMachine.js'
import { getDoorPlacement } from './doorPlacement.js'

const BACKGROUND = 0x06070a
const EYE_Y = 1.6
const START_Z = 0.4
const FOV = 62
const FOV_SELECTED = 50
const REFERENCE_ASPECT = 1.5 // below this width/height ratio the FOV is widened (see resize)
const TURN_SECONDS = 1.2
const MAX_YAW = 1.25
const MAX_PITCH = 0.3
const DRAG_THRESHOLD = 6

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smoothstep = (k) => k * k * (3 - 2 * k)

// Sign texture: the text is drawn on a 2D canvas, then used as a texture.
function createLabel(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const font = (size) => `900 ${size}px "Big Shoulders Display", Impact, sans-serif`
  const label = text.toUpperCase()
  ctx.font = font(72)
  const width = ctx.measureText(label).width
  if (width > 470) ctx.font = font(Math.floor((72 * 470) / width))
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.fillText(label, 256, 90)
  return new CanvasTexture(canvas)
}

// createCorridor(container, { rooms, onEnter }) -> { dispose }
// rooms: [{ id, slug, name, accent }]. Calls onEnter(room) once the camera faces the chosen door.
export function createCorridor(container, { rooms, onEnter }) {
  // ---- Renderer, scene, camera
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
  scene.background = new Color(BACKGROUND)
  scene.fog = new Fog(BACKGROUND, 6, 22)
  scene.add(new AmbientLight(0x8a8fa0, 0.35))
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60)

  const add = (geometry, material, x, y, z, rx = 0, ry = 0) => {
    const mesh = new Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.rotation.set(rx, ry, 0)
    scene.add(mesh)
    return mesh
  }

  // ---- Corridor: floor, ceiling, two walls, exit sign
  const wall = new MeshStandardMaterial({ color: 0x14161b, roughness: 0.9 })
  const floor = new MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.4, metalness: 0.3 })
  add(new PlaneGeometry(6, 30), floor, 0, 0, -8, -Math.PI / 2)
  add(new PlaneGeometry(6, 30), wall, 0, 3.2, -8, Math.PI / 2)
  add(new PlaneGeometry(30, 3.2), wall, -3, 1.6, -8, 0, Math.PI / 2)
  add(new PlaneGeometry(30, 3.2), wall, 3, 1.6, -8, 0, -Math.PI / 2)
  const exitSign = add(
    new PlaneGeometry(1.6, 0.5),
    new MeshBasicMaterial({ map: createLabel('salida', '#3dff8f'), transparent: true }),
    0,
    2.5,
    -20,
  )

  // ---- Doors: one per room, placed by getDoorPlacement
  const doors = rooms.map((room, index) => {
    const { side, x, z, ry } = getDoorPlacement(index)
    const color = new Color(room.accent)
    const material = new MeshStandardMaterial({
      color: 0x1b1d23,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.6,
    })
    const door = add(new BoxGeometry(1.5, 2.5, 0.12), material, x, 1.25, z, 0, ry)
    const border = add(
      new BoxGeometry(1.7, 2.7, 0.08),
      new MeshBasicMaterial({ color }),
      x - side * 0.03,
      1.35,
      z,
      0,
      ry,
    )
    border.scale.set(1, 1, 0.5)
    add(
      new PlaneGeometry(2, 0.5),
      new MeshBasicMaterial({ map: createLabel(room.name, room.accent), transparent: true }),
      x - side * 0.1,
      2.95,
      z,
      0,
      ry,
    )
    const light = new PointLight(color, 1.1, 7)
    light.position.set(side * 2.2, 1.6, z)
    scene.add(light)
    door.userData = { room, side, z, material, light }
    return door
  })

  // ---- State: the door machine decides what is hovered / selected / entered
  let state = initialState
  const dispatch = (event) => {
    state = transition(state, event)
    canvas.style.cursor = state.status === 'idle' ? '' : 'pointer'
  }
  const doorOf = (id) => doors.find((d) => d.userData.room.id === id)

  const raycaster = new Raycaster()
  const mouse = new Vector2(9, 9) // out of the screen = no pointer
  let mouseX = 0
  let mouseY = 0
  let dragStart = null
  let dragDistance = 0
  let dragYaw = 0
  let dragPitch = 0

  const setPointer = (e) => {
    const box = canvas.getBoundingClientRect()
    mouse.set(
      ((e.clientX - box.left) / box.width) * 2 - 1,
      -((e.clientY - box.top) / box.height) * 2 + 1,
    )
  }
  const isChoosing = () => state.status === 'idle' || state.status === 'hover'

  canvas.addEventListener('pointerdown', (e) => {
    setPointer(e)
    dragStart = { x: e.clientX, y: e.clientY }
    dragDistance = 0
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointerup', () => {
    dragStart = null
  })
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e)
    mouseX = mouse.x
    mouseY = mouse.y
    if (!dragStart || !isChoosing()) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    dragDistance += Math.abs(dx) + Math.abs(dy)
    dragYaw = clamp(dragYaw - dx * 0.004, -MAX_YAW, MAX_YAW)
    dragPitch = clamp(dragPitch + dy * 0.003, -MAX_PITCH, MAX_PITCH)
    dragStart = { x: e.clientX, y: e.clientY }
  })
  canvas.addEventListener('pointerleave', () => {
    mouse.set(9, 9)
    mouseX = 0
    mouseY = 0
  })
  canvas.addEventListener('click', () => {
    if (dragDistance > DRAG_THRESHOLD || !isChoosing()) return
    raycaster.setFromCamera(mouse, camera)
    const hit = raycaster.intersectObjects(doors)[0]
    if (hit) dispatch({ type: 'SELECT', doorId: hit.object.userData.room.id })
  })

  // ---- Resize
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Narrow window: widen the vertical FOV so the horizontal view stays the one of a wide screen.
    const reference =
      Math.tan((FOV * Math.PI) / 360) * Math.max(1, REFERENCE_ASPECT / camera.aspect)
    fovScale = (Math.atan(reference) * 360) / Math.PI / FOV
    camera.updateProjectionMatrix()
  }
  let fovScale = 1
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  // ---- Animation loop
  const look = new Vector3()
  const doorScreen = new Vector3()
  const startTime = performance.now()
  let lastTime = startTime
  let frame
  let turn = 0 // 0 = looking down the corridor, 1 = facing the selected door
  let lean = 0 // 0..1, how much the camera leans toward the hovered door
  let leanDoor = null
  let yaw = 0
  let pitch = 0
  let shift = 0

  const stillOnDoor = () => {
    const door = doorOf(state.doorId)
    door.getWorldPosition(doorScreen)
    doorScreen.y = 1.3
    doorScreen.project(camera)
    return Math.abs(doorScreen.x - mouse.x) <= 0.35 && Math.abs(doorScreen.y - mouse.y) <= 0.8
  }

  const loop = (now) => {
    frame = requestAnimationFrame(loop)
    const elapsed = (now - startTime) / 1000
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now

    // Hover: raycast to acquire a door, keep it while the pointer stays near it on screen
    // (no flicker when the camera leans).
    if (isChoosing()) {
      raycaster.setFromCamera(mouse, camera)
      const hit = raycaster.intersectObjects(doors)[0]
      if (hit) {
        const id = hit.object.userData.room.id
        if (state.doorId !== id) dispatch({ type: 'HOVER', doorId: id })
      } else if (state.status === 'hover' && !stillOnDoor()) {
        dispatch({ type: 'LEAVE' })
      }
    }
    if (state.status === 'hover') leanDoor = doorOf(state.doorId)

    const chosen = state.status === 'idle' || state.status === 'hover' ? null : doorOf(state.doorId)
    const smooth = 1 - Math.exp(-dt * 2.6)
    turn = clamp(turn + (chosen ? dt / TURN_SECONDS : 0), 0, 1)
    lean += ((state.status === 'hover' ? 1 : 0) - lean) * (1 - Math.exp(-dt * 3))
    yaw += (dragYaw + mouseX * 0.22 - yaw) * smooth
    pitch += (dragPitch + mouseY * 0.07 - pitch) * smooth
    shift += (mouseX * 0.25 - shift) * smooth

    const e = smoothstep(turn)
    let [Y, P, X, Z, fov] = [yaw, pitch, shift, START_Z, FOV]
    if (leanDoor) {
      Y += ((leanDoor.userData.side * Math.PI) / 2 - Y) * 0.2 * lean // slight lean toward the door
      fov -= 5 * lean
    }
    if (chosen) {
      const { side, z } = chosen.userData
      Y += ((side * Math.PI) / 2 - Y) * e
      P *= 1 - e
      X += (-side * 1.9 - X) * e
      Z += (z - Z) * e
      fov += (FOV_SELECTED - fov) * e
    }
    camera.position.set(X, EYE_Y + Math.sin(elapsed * 0.8) * 0.03 * (1 - e), Z)
    camera.fov = fov * fovScale
    camera.updateProjectionMatrix()
    look.set(
      X + Math.sin(Y) * Math.cos(P) * 10,
      camera.position.y + Math.sin(P) * 10,
      Z - Math.cos(Y) * Math.cos(P) * 10,
    )
    camera.lookAt(look)

    // Selected door facing us: the machine moves to "entering", the page takes over.
    if (state.status === 'selected' && turn > 0.985) {
      dispatch({ type: 'ARRIVED' })
      onEnter(chosen.userData.room)
    }

    for (const door of doors) {
      const { material, light, room } = door.userData
      const on = state.status !== 'idle' && state.doorId === room.id
      material.emissiveIntensity += ((on ? 1.6 : 0.25) - material.emissiveIntensity) * 0.12
      light.intensity += ((on ? 2.6 : 1.1) - light.intensity) * 0.12
    }
    exitSign.material.opacity = 0.7 + Math.sin(elapsed * 3) * 0.3
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(loop)

  return {
    dispose() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
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
