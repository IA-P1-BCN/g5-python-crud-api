// Detects WebGL support. Used to choose Corridor or CorridorFallback.
import { useState } from 'react'

function detectWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    gl?.getExtension?.('WEBGL_lose_context')?.loseContext() // the probe must not hold a context
    return Boolean(gl)
  } catch {
    return false
  }
}

export function useWebGLSupport() {
  const [supported] = useState(detectWebGL)
  return supported
}
