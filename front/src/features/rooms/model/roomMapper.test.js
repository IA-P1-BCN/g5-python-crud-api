import { describe, expect, it } from 'vitest'
import { toRoom } from './roomMapper.js'
import { mapRoom, mapRoomsList } from './roomMapper'

const dto = {
  id: 3,
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
}

describe('toRoom', () => {
  it('maps backend snake_case fields to the view model', () => {
    expect(toRoom(dto)).toEqual({
      id: 3,
      slug: 'faro',
      name: 'Faro 1923',
      genre: 'Terror marítimo',
      minPlayers: 2,
      maxPlayers: 4,
      durationMin: 60,
      pricePerPlayer: 20,
      difficulty: 3,
      hook: dto.hook,
      story: dto.story,
      audience: dto.audience,
      isActive: true,
      hasUpcomingSlots: true,
    })
  })

  it('converts the Decimal string base_price into a number', () => {
    expect(toRoom({ ...dto, base_price: '22.50' }).pricePerPlayer).toBe(22.5)
  })

  it('isActive is false for an inactive room', () => {
    expect(toRoom({ ...dto, status: 'inactive' }).isActive).toBe(false)
  })

  it('hasUpcomingSlots is false when the field is missing (BR-R6)', () => {
    const withoutFlag = { ...dto }
    delete withoutFlag.has_upcoming_slots
    expect(toRoom(withoutFlag).hasUpcomingSlots).toBe(false)
  })

  it('hasUpcomingSlots is false when the backend says false', () => {
    expect(toRoom({ ...dto, has_upcoming_slots: false }).hasUpcomingSlots).toBe(false)
  })
})

describe('roomMapper', () => {
  describe('mapRoom', () => {
    test('mapea correctamente un objeto crudo del backend', () => {
      const raw = {
        id: '1',
        slug: 'sala-alfa',
        title: 'Alfa',
        subtitle: 'Subtítulo Alfa',
        description: 'Descripción',
        poster_url: 'http://example.com/poster.jpg',
        is_active: true,
        has_upcoming_slots: true,
        is_full: false,
      }

      const result = mapRoom(raw)

      expect(result).toEqual({
        id: '1',
        slug: 'sala-alfa',
        title: 'Alfa',
        subtitle: 'Subtítulo Alfa',
        description: 'Descripción',
        posterUrl: 'http://example.com/poster.jpg',
        isActive: true,
        hasUpcomingSlots: true,
        isFull: false,
      })
    })
  })

  describe('mapRoomsList', () => {
    test('filtra las salas que no están activas', () => {
      const rawRooms = [
        { id: '1', slug: 'alfa', title: 'Alfa', is_active: true, has_upcoming_slots: true },
        { id: '2', slug: 'inactiva', title: 'Inactiva', is_active: false, has_upcoming_slots: true },
        { id: '3', slug: 'beta', title: 'Beta', is_active: true, has_upcoming_slots: false },
      ]

      const result = mapRoomsList(rawRooms)

      expect(result).toHaveLength(2)
      expect(result.map(r => r.slug)).toEqual(['alfa', 'beta'])
    })

    test('retorna un array vacío si la entrada no es válida', () => {
      expect(mapRoomsList(null)).toEqual([])
      expect(mapRoomsList(undefined)).toEqual([])
      expect(mapRoomsList({})).toEqual([])
    })
  })
})