// Test helpers for animations (jsdom has no matchMedia and no AnimationEvent).
import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

export const stubMatchMedia = (matches) => {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

// React listens to the prefixed name when AnimationEvent is missing
export const fireAnimationEnd = (element, animationName = 'gate-cover') =>
  fireEvent(
    element,
    Object.assign(new Event('webkitAnimationEnd', { bubbles: true }), { animationName }),
  )
