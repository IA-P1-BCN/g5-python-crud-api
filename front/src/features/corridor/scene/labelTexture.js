import { CanvasTexture } from 'three'

const WIDTH = 512
const HEIGHT = 128
const FONT_SIZE = 72
const MAX_TEXT_WIDTH = 470

// Sign texture: the text is drawn on a 2D canvas, then used as a texture.
export function createLabel(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  const font = (size) => `900 ${size}px "Big Shoulders Display", Impact, sans-serif`
  const label = text.toUpperCase()
  ctx.font = font(FONT_SIZE)
  const width = ctx.measureText(label).width
  if (width > MAX_TEXT_WIDTH) ctx.font = font(Math.floor((FONT_SIZE * MAX_TEXT_WIDTH) / width))
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.fillText(label, WIDTH / 2, 90)
  return new CanvasTexture(canvas)
}
