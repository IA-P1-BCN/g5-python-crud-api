import { Mesh } from 'three'

// Builds a mesh at (x, y, z) with the given X/Y rotation and adds it to the scene.
export function addMesh(scene, geometry, material, x, y, z, rx = 0, ry = 0) {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.rotation.set(rx, ry, 0)
  scene.add(mesh)
  return mesh
}
