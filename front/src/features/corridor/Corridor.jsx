// React wrapper: useEffect creates the corridor, cleanup calls dispose(). No 60fps state in React.
import { useEffect, useRef } from 'react'
import { createCorridor } from './createCorridor.js'

export default function Corridor({ rooms, onEnter }) {
  const containerRef = useRef(null)
  const onEnterRef = useRef(onEnter)

  // Keep the latest onEnter without recreating the 3D scene when its identity changes.
  useEffect(() => {
    onEnterRef.current = onEnter
  })

  useEffect(() => {
    const corridor = createCorridor(containerRef.current, {
      rooms,
      onEnter: (room) => onEnterRef.current(room),
    })
    return () => corridor.dispose()
  }, [rooms])

  return <div ref={containerRef} className="h-screen w-full" />
}
