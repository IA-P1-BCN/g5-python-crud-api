import { Vector3 } from 'three'
import { clamp, smoothstep } from './math.js'

const EYE_Y = 1.6
const START_Z = 0.4
const FOV = 62
const FOV_SELECTED = 50
const REFERENCE_ASPECT = 1.5 // below this width/height ratio the FOV is widened (see fitAspect)
const TURN_SECONDS = 1.2

// Moves the camera every frame: idle sway, mouse/drag look, lean toward the hovered door and
// the walk up to the chosen one. `turn` goes 0 (down the corridor) -> 1 (facing the door).
export function createCameraRig(camera) {
  const look = new Vector3()
  let fovScale = 1
  let turn = 0
  let lean = 0 // 0..1, how much the camera leans toward the hovered door
  let leanDoor = null
  let yaw = 0
  let pitch = 0
  let shift = 0

  return {
    get turn() {
      return turn
    },
    // Narrow window: widen the vertical FOV so the horizontal view stays the one of a wide screen.
    fitAspect(aspect) {
      const reference = Math.tan((FOV * Math.PI) / 360) * Math.max(1, REFERENCE_ASPECT / aspect)
      fovScale = (Math.atan(reference) * 360) / Math.PI / FOV
    },
    step({ dt, elapsed, input, hoverDoor = null, chosenDoor = null }) {
      if (hoverDoor) leanDoor = hoverDoor
      const smooth = 1 - Math.exp(-dt * 2.6)
      turn = clamp(turn + (chosenDoor ? dt / TURN_SECONDS : 0), 0, 1)
      lean += ((hoverDoor ? 1 : 0) - lean) * (1 - Math.exp(-dt * 3))
      yaw += (input.dragYaw + input.mouseX * 0.22 - yaw) * smooth
      pitch += (input.dragPitch + input.mouseY * 0.07 - pitch) * smooth
      shift += (input.mouseX * 0.25 - shift) * smooth

      const e = smoothstep(turn)
      let [Y, P, X, Z, fov] = [yaw, pitch, shift, START_Z, FOV]
      if (leanDoor) {
        Y += ((leanDoor.userData.side * Math.PI) / 2 - Y) * 0.2 * lean // slight lean toward the door
        fov -= 5 * lean
      }
      if (chosenDoor) {
        const { side, z } = chosenDoor.userData
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
    },
  }
}
