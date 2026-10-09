// React wrapper: useEffect creates the corridor, cleanup calls dispose(). No 60fps state in React.
import { useEffect, useRef } from 'react'
import { createCorridor } from '../scene/createCorridor.js'

export default function Corridor({ rooms, onEnter, onError }) {
  const containerRef = useRef(null)
  const onEnterRef = useRef(onEnter)
  const onErrorRef = useRef(onError)

  // Keep the latest callbacks without recreating the 3D scene when their identity changes.
  useEffect(() => {
    onEnterRef.current = onEnter
    onErrorRef.current = onError
  })

  useEffect(() => {
    let corridor
    try {
      corridor = createCorridor(containerRef.current, {
        rooms,
        onEnter: (room) => onEnterRef.current(room),
      })
    } catch (error) {
      // WebGL can fail even after detection (context limit, blocklisted GPU).
      onErrorRef.current?.(error)
      return undefined
    }
    return () => corridor.dispose()
  }, [rooms])

  return <div ref={containerRef} className="h-screen w-full" />
}
