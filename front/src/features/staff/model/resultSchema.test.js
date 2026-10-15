import { describe, it, expect } from 'vitest'
import { resultSchema } from './resultSchema.js'

describe('resultSchema', () => {
  it('accepts a result and turns the time text into a number', () => {
    const parsed = resultSchema.safeParse({ completed: true, completion_time: '1800' })
    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual({ completed: true, completion_time: 1800 })
  })

  it('accepts a failed game with time 0', () => {
    const parsed = resultSchema.safeParse({ completed: false, completion_time: '0' })
    expect(parsed.success).toBe(true)
  })

  it('rejects a negative time', () => {
    const parsed = resultSchema.safeParse({ completed: true, completion_time: '-5' })
    expect(parsed.success).toBe(false)
  })

  it('rejects an empty time (not silently 0)', () => {
    const parsed = resultSchema.safeParse({ completed: true, completion_time: '' })
    expect(parsed.success).toBe(false)
  })

  it('rejects a decimal time', () => {
    const parsed = resultSchema.safeParse({ completed: true, completion_time: '12.5' })
    expect(parsed.success).toBe(false)
  })
})
