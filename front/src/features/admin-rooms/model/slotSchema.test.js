import { describe, it, expect } from 'vitest'
import { slotSchema, toSlotPayload, toSlotView } from './slotSchema'

const valid = { date: '2030-11-04', startTime: '10:00', endTime: '11:00' }
const firstMessage = (r) => r.error.issues[0].message

describe('slotSchema', () => {
  it('acepta una franja válida', () => {
    expect(slotSchema.safeParse(valid).success).toBe(true)
  })
  it('rechaza campos vacíos', () => {
    const r = slotSchema.safeParse({ date: '', startTime: '', endTime: '' })
    expect(r.success).toBe(false)
    expect(firstMessage(r)).toBe('required')
  })
  it('rechaza una hora mal formada', () => {
    expect(firstMessage(slotSchema.safeParse({ ...valid, startTime: '25:99' }))).toBe('invalidTime')
  })
  it('rechaza fin igual o anterior al inicio (BR-S1)', () => {
    expect(firstMessage(slotSchema.safeParse({ ...valid, endTime: '10:00' }))).toBe(
      'endBeforeStart',
    )
  })
  it('rechaza inicio en el pasado (BR-S2)', () => {
    expect(firstMessage(slotSchema.safeParse({ ...valid, date: '2020-01-01' }))).toBe('startInPast')
  })
  it('convierte a payload UTC y vuelve a la vista local', () => {
    const p = toSlotPayload(valid)
    const view = toSlotView({ id: 1, ...p, status: 'available', state: 'free' })
    expect(view).toMatchObject({ date: '2030-11-04', startTime: '10:00', endTime: '11:00' })
  })
})
