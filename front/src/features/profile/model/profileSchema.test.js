import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { profileSchema } from './profileSchema.js'

const firstMessage = (data) => profileSchema.safeParse(data).error?.issues[0].message

describe('profileSchema', () => {
  it('accepts a name with no phone', () => {
    expect(profileSchema.safeParse({ name: 'Ana', phone: '' }).success).toBe(true)
  })

  it('accepts a name and a phone', () => {
    expect(profileSchema.safeParse({ name: 'Ana', phone: '600 123 456' }).success).toBe(true)
  })

  it('rejects an empty name (BR-U2)', () => {
    expect(firstMessage({ name: '', phone: '' })).toBe(es.profile.nameRequired)
  })

  it('rejects a name made only of spaces', () => {
    expect(firstMessage({ name: '   ', phone: '' })).toBe(es.profile.nameRequired)
  })

  it('rejects a name over 100 characters (BR-U2)', () => {
    expect(firstMessage({ name: 'a'.repeat(101), phone: '' })).toBe(es.profile.nameTooLong)
  })

  it('rejects a phone over 50 characters', () => {
    expect(firstMessage({ name: 'Ana', phone: '6'.repeat(51) })).toBe(es.profile.phoneTooLong)
  })
})
