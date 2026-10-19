import { useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion.js'
import Corridor from './Corridor.jsx'
import CorridorFallback from './CorridorFallback.jsx'
import { getCorridorMode } from '../model/corridorMode.js'
import { useWebGLSupport } from '../hooks/useWebGLSupport.js'

const SMALL_SCREEN_QUERY = '(max-width: 767px)'

export default function CorridorView({ rooms, onEnter, listBelow = false }) {
  const hasWebGL = useWebGLSupport()
  const reducedMotion = useReducedMotion()
  const smallScreen = useMediaQuery(SMALL_SCREEN_QUERY)

  const [sceneFailed, setSceneFailed] = useState(false)

  const mode = getCorridorMode({ hasWebGL: hasWebGL && !sceneFailed, reducedMotion, smallScreen })

  if (mode !== '3d') return listBelow ? null : <CorridorFallback rooms={rooms} onEnter={onEnter} />

  return (
    <>
      <Corridor rooms={rooms} onEnter={onEnter} onError={() => setSceneFailed(true)} />
      {!listBelow && (
        <div className="sr-only">
          <CorridorFallback rooms={rooms} onEnter={onEnter} />
        </div>
      )}
    </>
  )
}
