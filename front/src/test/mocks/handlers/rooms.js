// MSW handlers for the rooms endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.

export const roomDto = (overrides = {}) => ({
  id: 1,
  name: 'Faro 1923',
  slug: 'faro',
  genre: 'Terror marítimo',
  min_players: 2,
  capacity: 4,
  duration: 60,
  base_price: '20.00',
  difficulty: 3,
  hook: 'El diario del farero se interrumpe a mitad de frase.',
  story: 'Cabo de Creus, una noche de temporal.',
  audience: 'Para quien busca sustos',
  status: 'active',
  has_upcoming_slots: true,
  ...overrides,
})

export default []
