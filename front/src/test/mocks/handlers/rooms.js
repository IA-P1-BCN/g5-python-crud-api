import { http, HttpResponse } from 'msw'

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

export const roomsPage = (items, overrides = {}) => ({
  items,
  total: items.length,
  page: 1,
  size: 20,
  ...overrides,
})

export default []

const roomsFixture = [
  {
    id: '1',
    slug: 'sala-alfa',
    title: 'Alfa',
    subtitle: 'Subtítulo Alfa',
    description: 'Descripción Alfa',
    poster_url: 'http://example.com/poster-alfa.jpg',
    is_active: true,
    has_upcoming_slots: true,
    is_full: false,
  },
  {
    id: '2',
    slug: 'sala-beta',
    title: 'Beta',
    subtitle: 'Subtítulo Beta',
    description: 'Descripción Beta',
    poster_url: 'http://example.com/poster-beta.jpg',
    is_active: true,
    has_upcoming_slots: true,
    is_full: true,
  },
  {
    id: '3',
    slug: 'sala-inactiva',
    title: 'Inactiva',
    is_active: false,
    has_upcoming_slots: true,
    is_full: false,
  },
]

export const roomsHandlers = [
  http.get('/api/v1/rooms', () => HttpResponse.json(roomsPage(roomsFixture))),
  http.get('/api/v1/rooms/:slug', ({ params }) => {
    const room = roomsFixture.find((r) => r.slug === params.slug)
    if (!room) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(room)
  }),
]
