// Registry slug -> theme (colors, ambiance, entrance). New room = new entry, never an if (room === 'x'). A room without an entry gets a generated theme (see the room themes ticket).
export const ROOM_THEMES = {
  relojero: { accent: '#e0a243', dark: '#2a1b0d', ambiance: 'clock', entrance: 'gears' },
  biblioteca: { accent: '#4fc48f', dark: '#0c2a20', ambiance: 'dust', entrance: 'book' },
  faro: { accent: '#5cc3e6', dark: '#0a2734', ambiance: 'beam', entrance: 'fog' },
  atraco: { accent: '#ff4560', dark: '#1d0b10', ambiance: 'lasers', entrance: 'vault' },
  lab: { accent: '#9aa0a6', dark: '#1b1d20', ambiance: 'scan', entrance: 'airlock' },
}

export const DEFAULT_THEME = {
  accent: '#9aa0a6',
  dark: '#1b1d20',
  ambiance: 'none',
  entrance: 'fade',
}

export function getRoomTheme(slug) {
  return ROOM_THEMES[slug] ?? DEFAULT_THEME
}
