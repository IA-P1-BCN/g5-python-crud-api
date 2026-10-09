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

// Pairs that are not plain text-on-background in @theme.
const hexOf = (value) => value.match(/#[0-9a-f]{6}/i)?.[0]
const mix = (fg, bg, amount) =>
  '#' +
  [1, 3, 5]
    .map((i) => {
      const a = parseInt(fg.slice(i, i + 2), 16)
      const b = parseInt(bg.slice(i, i + 2), 16)
      return Math.round(a * amount + b * (1 - amount))
        .toString(16)
        .padStart(2, '0')
    })
    .join('')

describe('colour contrast of derived pairs (WCAG AA)', () => {
  it('muted text on surface-2 (Select labels, Dialog description)', () => {
    expect(ratio(colour('muted'), colour('surface-2'))).toBeGreaterThanOrEqual(4.5)
  })

  // Badge: text-<tone> on bg-<tone>/15 over the surface.
  it.each(['pending', 'confirmed', 'in-progress', 'done', 'cancelled', 'error'])(
    'Badge %s text on its 15% tint',
    (tone) => {
      const background = mix(colour(tone), colour('surface'), 0.15)
      expect(ratio(colour(tone), background)).toBeGreaterThanOrEqual(4.5)
    },
  )

  // Every room theme (the default one in :root and each [data-room]): --rc accent, --rd dark.
  const rooms = [
    ['default', css.match(/:root\s*\{\s*--rc:\s*(#\w+);\s*--rd:\s*(#\w+);/)],
    ...[...css.matchAll(/\[data-room='(\w+)'\]\s*\{\s*--rc:\s*(#\w+);\s*--rd:\s*(#\w+);/g)].map(
      (m) => [m[1], [m[0], m[2], m[3]]],
    ),
  ]

  it('finds the default theme and the room themes in index.css', () => {
    expect(rooms.length).toBeGreaterThanOrEqual(2)
    rooms.forEach(([, match]) => expect(match).not.toBeNull())
  })

  it.each(rooms)('room %s: on-room text on the accent, accent and text on the dark', (_, match) => {
    const [, accent, dark] = match
    expect(ratio(colour('on-room'), hexOf(accent))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(hexOf(accent), hexOf(dark))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(colour('text'), hexOf(dark))).toBeGreaterThanOrEqual(4.5)
  })
})
