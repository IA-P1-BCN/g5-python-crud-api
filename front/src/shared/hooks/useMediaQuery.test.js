import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery.js'

// jsdom has no matchMedia: build a controllable fake.
function mockMatchMedia(initial) {
  let matches = initial
  const listeners = new Set()
  const mql = {
    get matches() {
      return matches
    },
    addEventListener: (_type, cb) => listeners.add(cb),
    removeEventListener: (_type, cb) => listeners.delete(cb),
  }
  window.matchMedia = vi.fn(() => mql)
  return {
    listeners,
    set(value) {
      matches = value
      listeners.forEach((cb) => cb())
    },
  }
}

afterEach(() => {
  delete window.matchMedia
})

describe('useMediaQuery', () => {
  it('returns whether the query matches, and asks the browser for that query', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('returns false when the query does not match', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
  })

  it('updates when the browser reports a change', () => {
    const media = mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))

    act(() => media.set(true))

    expect(result.current).toBe(true)
  })

  it('stops listening on unmount', () => {
    const media = mockMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(media.listeners.size).toBe(1)

    unmount()

    expect(media.listeners.size).toBe(0)
  })

  it('returns false when matchMedia does not exist', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
  })
})
