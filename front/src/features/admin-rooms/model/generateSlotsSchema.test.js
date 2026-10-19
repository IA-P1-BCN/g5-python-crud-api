import { describe, expect, it } from 'vitest'
import { generateSlotsSchema, toUtcPayload } from './generateSlotsSchema'

const valid = {
  date_from: '2030-11-04',
  date_to: '2030-11-10',
  first_start: '10:00',
  last_start: '20:00',
}
const messages = (data) =>
  generateSlotsSchema.safeParse(data).error?.issues.map((i) => i.message) ?? []

describe('generateSlotsSchema', () => {
  it('accepts a valid range and returns the API payload', () => {
    expect(generateSlotsSchema.parse(valid)).toEqual(valid)
  })

  it('rejects empty fields, one error per field', () => {
    const r = generateSlotsSchema.safeParse({
      date_from: '',
      date_to: '',
      first_start: '',
      last_start: '',
    })
    expect(new Set(r.error.issues.map((i) => i.path[0])).size).toBe(4)
  })

  it('rejects date_to before date_from', () => {
    expect(messages({ ...valid, date_to: '2030-11-01' })).toHaveLength(1)
  })

  it('accepts exactly 90 days apart and rejects 91', () => {
    expect(generateSlotsSchema.safeParse({ ...valid, date_to: '2031-02-02' }).success).toBe(true)
    expect(generateSlotsSchema.safeParse({ ...valid, date_to: '2031-02-03' }).success).toBe(false)
  })

  it('rejects first_start after last_start', () => {
    expect(messages({ ...valid, first_start: '21:00' })).toHaveLength(1)
  })
})

describe('toUtcPayload', () => {
  it('sends the local time as UTC (works in any machine timezone)', () => {
    const local = new Date('2030-07-01T10:00')
    const out = toUtcPayload({ ...valid, date_from: '2030-07-01', first_start: '10:00' })
    expect(out.first_start).toBe(local.toISOString().slice(11, 16))
  })
})
