// Unit tests for the checkout form schema (BR-U1, BR-U2).
import { describe, it, expect } from 'vitest'
import { checkoutSchema } from './checkoutSchema'

const valid = { name: 'Ana Lopez', email: 'ana@example.com', phone: '+34 600 123 456' }

// Names of the fields that failed validation.
const failedFields = (data) => {
  const result = checkoutSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((issue) => issue.path[0])
}

describe('checkoutSchema', () => {
  it('accepts a complete and valid form', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an empty phone (optional)', () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: '' }).success).toBe(true)
  })

  it('rejects an empty name, even with only spaces', () => {
    expect(failedFields({ ...valid, name: '' })).toEqual(['name'])
    expect(failedFields({ ...valid, name: '   ' })).toEqual(['name'])
  })

  it('rejects a name longer than 100 characters', () => {
    expect(failedFields({ ...valid, name: 'a'.repeat(101) })).toEqual(['name'])
  })

  it('rejects an empty or malformed email', () => {
    expect(failedFields({ ...valid, email: '' })).toEqual(['email'])
    expect(failedFields({ ...valid, email: 'not-an-email' })).toEqual(['email'])
  })

  it('rejects a phone with letters', () => {
    expect(failedFields({ ...valid, phone: '600abc' })).toEqual(['phone'])
  })
})
