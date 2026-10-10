export function getCorridorMode({ hasWebGL, reducedMotion, smallScreen }) {
  return hasWebGL && !reducedMotion && !smallScreen ? '3d' : 'fallback'
}
