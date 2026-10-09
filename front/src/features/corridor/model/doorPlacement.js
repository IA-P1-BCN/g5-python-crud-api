const WALL_X = 2.95
const FIRST_Z = -3
const PAIR_SPACING = 5.5

// Doors alternate left/right; each pair of rooms sits one PAIR_SPACING deeper in the corridor.
export function getDoorPlacement(index) {
  const side = index % 2 ? 1 : -1
  return {
    side,
    x: side * WALL_X,
    z: FIRST_Z - Math.floor(index / 2) * PAIR_SPACING,
    ry: (-side * Math.PI) / 2,
  }
}
