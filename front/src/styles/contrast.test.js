import { readFileSync } from 'node:fs'

// Vitest empties CSS imports, so read the file from disk (same trick as theme.test.js).
const css = readFileSync('src/index.css', 'utf8')
const theme = css.match(/@theme\s*\{([^}]*)\}/)?.[1] ?? ''

const colour = (name) => theme.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})\\b`, 'i'))?.[1]

// WCAG 2.x relative luminance and contrast ratio.
const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [text colour, background colour]: every pair the UI actually uses (WCAG AA = 4.5).
const PAIRS = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surface-2'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['on-exit', 'exit'],
  ['error', 'surface'],
  ['pending', 'surface'],
  ['confirmed', 'surface'],
  ['in-progress', 'surface'],
  ['done', 'surface'],
  ['cancelled', 'surface'],
]

describe('colour contrast (WCAG AA)', () => {
  it.each(PAIRS)('%s on %s is at least 4.5:1', (fg, bg) => {
    const a = colour(fg)
    const b = colour(bg)
    expect(a, `--color-${fg} missing in @theme`).toBeDefined()
    expect(b, `--color-${bg} missing in @theme`).toBeDefined()
    expect(ratio(a, b)).toBeGreaterThanOrEqual(4.5)
  })
})
