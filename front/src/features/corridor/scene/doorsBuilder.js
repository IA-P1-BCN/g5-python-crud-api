import {
  BoxGeometry,
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
} from 'three'
import { getDoorPlacement } from '../model/doorPlacement.js'
import { addMesh } from './addMesh.js'
import { createLabel } from './labelTexture.js'

const DOOR_SIZE = [1.5, 2.5, 0.12]
const BORDER_PADDING = 0.2 // the frame is the door plus this on width and height
export const IDLE_EMISSIVE = 0.25
export const IDLE_LIGHT = 1.1

// One door per room, in the same order as `rooms`. Each door keeps what the animation needs
// in userData: { room, side, z, material, light }.
export function buildDoors(scene, rooms) {
  return rooms.map((room, index) => {
    const { side, x, z, ry } = getDoorPlacement(index)
    const color = new Color(room.accent)
    const material = new MeshStandardMaterial({
      color: 0x1b1d23,
      emissive: color,
      emissiveIntensity: IDLE_EMISSIVE,
      roughness: 0.6,
    })
    const door = addMesh(scene, new BoxGeometry(...DOOR_SIZE), material, x, 1.25, z, 0, ry)
    const border = addMesh(
      scene,
      new BoxGeometry(DOOR_SIZE[0] + BORDER_PADDING, DOOR_SIZE[1] + BORDER_PADDING, 0.08),
      new MeshBasicMaterial({ color }),
      x - side * 0.03,
      1.35,
      z,
      0,
      ry,
    )
    border.scale.set(1, 1, 0.5)
    addMesh(
      scene,
      new PlaneGeometry(2, 0.5),
      new MeshBasicMaterial({ map: createLabel(room.name, room.accent), transparent: true }),
      x - side * 0.1,
      2.95,
      z,
      0,
      ry,
    )
    const light = new PointLight(color, IDLE_LIGHT, 7)
    light.position.set(side * 2.2, 1.6, z)
    scene.add(light)
    door.userData = { room, side, z, material, light }
    return door
  })
}
