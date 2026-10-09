import { readFileSync } from 'node:fs'
import { ROOM_THEMES, DEFAULT_THEME } from '../features/rooms/model/roomThemes.js'

// Returns the declarations inside the first CSS block whose selector matches.
const block = (selector) => css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'i'))?.[1] ?? ''
// Vitest runs from front/, and the CSS import is emptied by Vitest, so read the file from disk.
const css = readFileSync('src/index.css', 'utf8')

describe('room theme CSS', () => {
  it.each(Object.entries(ROOM_THEMES))(
    '[data-room=%s] matches the registry colours',
    (slug, theme) => {
      const declarations = block(`\\[data-room=["']?${slug}["']?\\]`)
      expect(declarations).toContain(`--rc: ${theme.accent}`)
      expect(declarations).toContain(`--rd: ${theme.dark}`)
    },
  )

  it(':root holds the default theme for rooms that are not in the registry', () => {
    const declarations = block(':root')
    expect(declarations).toContain(`--rc: ${DEFAULT_THEME.accent}`)
    expect(declarations).toContain(`--rd: ${DEFAULT_THEME.dark}`)
  })

  it('exposes the room colours to Tailwind as bg-room / text-room utilities', () => {
    expect(css).toMatch(/@theme\s+inline\s*\{[^}]*--color-room:\s*var\(--rc\)/)
    expect(css).toMatch(/@theme\s+inline\s*\{[^}]*--color-room-dark:\s*var\(--rd\)/)
  })
})
