// Overlay played when entering a room (styles/gate.scss), in two phases: 'cover' then
// 'uncover'. Calls onDone when the phase's animation ends (at once under reduced motion).
import { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion.js'
import { getRoomTheme } from '../model/roomThemes.js'
import '@/styles/gate.scss'

export default function GateTransition({ room, phase = 'cover', onDone }) {
  const reduced = useReducedMotion()
  const donePhase = useRef(null)

  // onDone must run once per phase, even if several animations end or React re-runs the effect
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
      // pseudo-elements (the faro beam) also fire animationend on the gate: only its own counts
      onAnimationEnd={(e) =>
        e.target === e.currentTarget && e.animationName === `gate-${phase}` && finish()
      }
    >
      {/* parts drawn by gate.scss, depending on the entrance */}
      <span />
      <span />
    </div>
  )
}
