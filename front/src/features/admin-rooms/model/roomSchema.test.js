import { describe, it, expect } from 'vitest'
import { roomSchema } from './roomSchema'

const valid = {
  slug: 'sala-misterio',
  name: 'Sala Misterio',
  genre: 'Terror',
  duration: '60',
  base_price: '50',
  capacity: '6',
  min_players: '2',
  difficulty: '3',
  hook: 'Un misterio por resolver',
  story: 'Historia detallada...',
  audience: 'Todo público',
}
const messages = (data) => roomSchema.safeParse(data).error?.issues.map((i) => i.message) ?? []

describe('roomSchema', () => {
  it('accepts a correct room and returns numbers', () => {
    const result = roomSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ duration: 60, capacity: 6, min_players: 2, difficulty: 3 })
  })

  it('rejects an empty capacity instead of turning it into 0', () => {
    expect(messages({ ...valid, capacity: '' })).toContain('La capacidad es obligatoria')
  })

  it('rejects difficulty outside 1-5 and capacity over 50', () => {
    expect(messages({ ...valid, difficulty: '9' })).toContain(
      'La dificultad debe estar entre 1 y 5',
    )
    expect(messages({ ...valid, capacity: '51' })).toContain('La capacidad debe estar entre 1 y 50')
  })

  it('rejects empty genre, hook, story and audience (the API requires them)', () => {
    expect(messages({ ...valid, genre: '', hook: '', story: '', audience: '' })).toHaveLength(4)
  })

  it('fails when min_players exceeds capacity', () => {
    expect(messages({ ...valid, capacity: '4', min_players: '5' })).toContain(
      'El mínimo de jugadores no puede superar la capacidad',
    )
  })

  it('rejects a base price with more than 8 integer digits or 2 decimals', () => {
    const msg = 'El precio admite hasta 8 enteros y 2 decimales'
    expect(messages({ ...valid, base_price: '123456789' })).toContain(msg)
    expect(messages({ ...valid, base_price: '10.999' })).toContain(msg)
    expect(roomSchema.safeParse({ ...valid, base_price: '12345678.99' }).success).toBe(true)
  })

  it('rejects genre and audience over 100 characters', () => {
    const long = 'a'.repeat(101)
    expect(messages({ ...valid, genre: long })).toContain(
      'El género admite 100 caracteres como máximo',
    )
    expect(messages({ ...valid, audience: long })).toContain(
      'El público admite 100 caracteres como máximo',
    )
  })
})
