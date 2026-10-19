import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

export const stubMatchMedia = (matches) => {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

export const fireAnimationEnd = (element, animationName = 'gate-cover') =>
  fireEvent(
    element,
    Object.assign(new Event('webkitAnimationEnd', { bubbles: true }), { animationName }),
  )
