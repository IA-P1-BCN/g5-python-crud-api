import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLabel } from './labelTexture.js'

// jsdom has no 2D canvas: a fake context records the font that was picked.
function fakeContext(textWidth) {
  const ctx = { font: '', measureText: vi.fn(() => ({ width: textWidth })), fillText: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  return ctx
}

afterEach(() => vi.restoreAllMocks())

describe('createLabel', () => {
  it('draws the text in upper case on a 512x128 canvas texture', () => {
    const ctx = fakeContext(200)

    const texture = createLabel('faro', '#fff')

    expect(ctx.fillText).toHaveBeenCalledWith('FARO', 256, 90)
    expect(texture.image.width).toBe(512)
    expect(texture.image.height).toBe(128)
  })

  it('keeps the full font size when the text fits', () => {
    const ctx = fakeContext(200)

    createLabel('faro', '#fff')

    expect(ctx.font).toContain('72px')
  })

  it('shrinks the font so a long text still fits in the sign', () => {
    const ctx = fakeContext(940) // twice the 470px available

    createLabel('a very long room name', '#fff')

    expect(ctx.font).toContain('36px')
  })
})
