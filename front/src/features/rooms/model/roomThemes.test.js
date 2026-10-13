import { getRoomTheme, ROOM_THEMES, DEFAULT_THEME } from './roomThemes.js'

describe('roomThemes', () => {
  it('has a theme for each of the 5 seed rooms', () => {
    expect(Object.keys(ROOM_THEMES).sort()).toEqual([
      'atraco',
      'biblioteca',
      'faro',
      'lab',
      'relojero',
    ])
  })

  it('returns the registered theme for a known slug', () => {
    expect(getRoomTheme('faro').accent).toBe('#5cc3e6')
  })

  it('returns the default theme for an unknown slug (a new room never breaks the corridor)', () => {
    expect(getRoomTheme('sala-nueva')).toBe(DEFAULT_THEME)
  })

  it('returns the default theme when the slug is missing', () => {
    expect(getRoomTheme(undefined)).toBe(DEFAULT_THEME)
  })

  it('gives every theme the same shape', () => {
    for (const theme of [...Object.values(ROOM_THEMES), DEFAULT_THEME]) {
      expect(theme).toEqual(
        expect.objectContaining({
          accent: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          dark: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          ambiance: expect.any(String),
          entrance: expect.any(String),
        }),
      )
    }
  })
})
