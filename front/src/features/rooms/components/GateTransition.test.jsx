import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireAnimationEnd, stubMatchMedia } from '@/test/motion.js'
import GateTransition from './GateTransition.jsx'

afterEach(() => {
  delete window.matchMedia
})

describe('GateTransition', () => {
  it('calls onDone when the animation ends', () => {
    stubMatchMedia(false) // the user accepts animations
    const onDone = vi.fn()
    render(<GateTransition room={{ slug: 'faro' }} onDone={onDone} />)

    fireAnimationEnd(screen.getByTestId('gate'))

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('calls onDone right away when the user prefers reduced motion', () => {
    stubMatchMedia(true) // the user asked for less animation
    const onDone = vi.fn()
    render(<GateTransition room={{ slug: 'faro' }} onDone={onDone} />)

    // no animationEnd fired: the animation never plays, so it would never come
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('ignores the animation end of its inner parts', () => {
    stubMatchMedia(false)
    const onDone = vi.fn()
    render(<GateTransition room={{ slug: 'relojero' }} onDone={onDone} />)

    // animationend bubbles up from the children: only the gate's own end counts
    fireAnimationEnd(screen.getByTestId('gate').firstChild)

    expect(onDone).not.toHaveBeenCalled()
  })

  it('uses the entrance of the room theme, and a fade for an unknown room', () => {
    stubMatchMedia(false)
    const { rerender } = render(<GateTransition room={{ slug: 'faro' }} onDone={() => {}} />)
    expect(screen.getByTestId('gate')).toHaveAttribute('data-entrance', 'fog')

    rerender(<GateTransition room={{ slug: 'nouvelle-salle' }} onDone={() => {}} />)
    expect(screen.getByTestId('gate')).toHaveAttribute('data-entrance', 'fade')
  })

  it('calls onDone once per phase: cover, then uncover', () => {
    stubMatchMedia(false)
    const onDone = vi.fn()
    const { rerender } = render(<GateTransition room={{ slug: 'faro' }} onDone={onDone} />)
    fireAnimationEnd(screen.getByTestId('gate'))
    fireAnimationEnd(screen.getByTestId('gate'))
    expect(onDone).toHaveBeenCalledTimes(1)

    rerender(<GateTransition room={{ slug: 'faro' }} phase="uncover" onDone={onDone} />)
    expect(screen.getByTestId('gate')).toHaveAttribute('data-phase', 'uncover')
    fireAnimationEnd(screen.getByTestId('gate'), 'gate-uncover')
    expect(onDone).toHaveBeenCalledTimes(2)
  })

  it('ignores the animations of its pseudo-elements (faro beam)', () => {
    stubMatchMedia(false)
    const onDone = vi.fn()
    render(<GateTransition room={{ slug: 'faro' }} onDone={onDone} />)

    // a ::before animation reports the gate as target, but with its own name
    fireAnimationEnd(screen.getByTestId('gate'), 'gate-beam-cover')

    expect(onDone).not.toHaveBeenCalled()
  })
})
