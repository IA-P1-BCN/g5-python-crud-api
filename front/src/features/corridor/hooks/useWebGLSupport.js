// Detects WebGL support. Used to choose Corridor or CorridorFallback.
import { useState } from 'react'

function detectWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl'))
  } catch {
    return false
  }
}

export function useWebGLSupport() {
  const [supported] = useState(detectWebGL)
  return supported
}
