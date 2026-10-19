import { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion.js'
import { getRoomTheme } from '../model/roomThemes.js'
import '@/styles/gate.scss'

export default function GateTransition({ room, phase = 'cover', onDone }) {
  const reduced = useReducedMotion()
  const donePhase = useRef(null)

  const finish = useCallback(() => {
    if (donePhase.current === phase) return
    donePhase.current = phase
    onDone()
  }, [phase, onDone])

  useEffect(() => {
    if (reduced) finish()
  }, [reduced, finish])

  if (reduced) return null

  return (
    <div
      className="gate"
      data-testid="gate"
      data-room={room.slug}
      data-phase={phase}
      data-entrance={getRoomTheme(room.slug).entrance}
      aria-hidden="true"
      onAnimationEnd={(e) =>
        e.target === e.currentTarget && e.animationName === `gate-${phase}` && finish()
      }
    >
      <span />
      <span />
    </div>
  )
}
