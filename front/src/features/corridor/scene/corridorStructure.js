import {
  AmbientLight,
  Color,
  Fog,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three'
import { addMesh } from './addMesh.js'
import { createLabel } from './labelTexture.js'

const BACKGROUND = 0x06070a

// Floor, ceiling, two walls, ambient light and the exit sign. Returns the sign (it blinks).
export function buildCorridorStructure(scene) {
  scene.background = new Color(BACKGROUND)
  scene.fog = new Fog(BACKGROUND, 6, 22)
  scene.add(new AmbientLight(0x8a8fa0, 0.35))

  const wall = new MeshStandardMaterial({ color: 0x14161b, roughness: 0.9 })
  const floor = new MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.4, metalness: 0.3 })
  addMesh(scene, new PlaneGeometry(6, 30), floor, 0, 0, -8, -Math.PI / 2)
  addMesh(scene, new PlaneGeometry(6, 30), wall, 0, 3.2, -8, Math.PI / 2)
  addMesh(scene, new PlaneGeometry(30, 3.2), wall, -3, 1.6, -8, 0, Math.PI / 2)
  addMesh(scene, new PlaneGeometry(30, 3.2), wall, 3, 1.6, -8, 0, -Math.PI / 2)
  const exitSign = addMesh(
    scene,
    new PlaneGeometry(1.6, 0.5),
    new MeshBasicMaterial({ map: createLabel('salida', '#3dff8f'), transparent: true }),
    0,
    2.5,
    -20,
  )
  return { exitSign }
}
