import { useEffect, useRef } from 'react'
import { createCorridor } from '../scene/createCorridor.js'

export default function Corridor({ rooms, onEnter, onError }) {
  const containerRef = useRef(null)
  const onEnterRef = useRef(onEnter)
  const onErrorRef = useRef(onError)

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
      onErrorRef.current?.(error)
      return undefined
    }
    return () => corridor.dispose()
  }, [rooms])

  return (
    <div
      ref={containerRef}
      className="border-line mb-8 h-[clamp(340px,60vh,540px)] w-full overflow-hidden rounded-lg border"
    />
  )
}
