import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWebGLSupport } from './useWebGLSupport.js'

const mockGetContext = (impl) =>
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(impl)

afterEach(() => vi.restoreAllMocks())

describe('useWebGLSupport', () => {
  it('is true when the browser gives a WebGL context', () => {
    mockGetContext(() => ({}))
    const { result } = renderHook(() => useWebGLSupport())
    expect(result.current).toBe(true)
  })

  it('asks for a "webgl" context (what Three.js r128 uses)', () => {
    const spy = mockGetContext(() => ({}))
    renderHook(() => useWebGLSupport())
    expect(spy).toHaveBeenCalledWith('webgl')
  })

  it('is false when the browser returns no context', () => {
    mockGetContext(() => null)
    const { result } = renderHook(() => useWebGLSupport())
    expect(result.current).toBe(false)
  })

  it('is false when creating the context throws', () => {
    mockGetContext(() => {
      throw new Error('WebGL disabled')
    })
    const { result } = renderHook(() => useWebGLSupport())
    expect(result.current).toBe(false)
  })

  it('releases the probe context so it does not count toward the browser limit', () => {
    const loseContext = vi.fn()
    mockGetContext(() => ({ getExtension: () => ({ loseContext }) }))
    renderHook(() => useWebGLSupport())
    expect(loseContext).toHaveBeenCalledTimes(1)
  })
})
