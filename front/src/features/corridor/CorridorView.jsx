import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion.js'
import Corridor from './Corridor.jsx'
import CorridorFallback from './CorridorFallback.jsx'
import { getCorridorMode } from './corridorMode.js'
import { useWebGLSupport } from './useWebGLSupport.js'

// Below Tailwind's `md` breakpoint (768px).
const SMALL_SCREEN_QUERY = '(max-width: 767px)'

export default function CorridorView({ rooms, onEnter }) {
  const hasWebGL = useWebGLSupport()
  const reducedMotion = useReducedMotion()
  const smallScreen = useMediaQuery(SMALL_SCREEN_QUERY)

  const mode = getCorridorMode({ hasWebGL, reducedMotion, smallScreen })

  return mode === '3d' ? (
    <Corridor rooms={rooms} onEnter={onEnter} />
  ) : (
    <CorridorFallback rooms={rooms} onEnter={onEnter} />
  )
}
