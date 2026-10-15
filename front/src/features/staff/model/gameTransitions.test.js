import { describe, it, expect } from 'vitest'
import { allowedActions } from './gameTransitions.js'

describe('allowedActions', () => {
  it('PENDING → confirm', () => {
    expect(allowedActions({ status: 'PENDING', result: null })).toEqual(['confirm'])
  })

  it('CONFIRMED → start', () => {
    expect(allowedActions({ status: 'CONFIRMED', result: null })).toEqual(['start'])
  })

  it('IN_PROGRESS → finish', () => {
    expect(allowedActions({ status: 'IN_PROGRESS', result: null })).toEqual(['finish'])
  })

  it('COMPLETED without result → register_result', () => {
    expect(allowedActions({ status: 'COMPLETED', result: null })).toEqual(['register_result'])
  })

  it('COMPLETED with result → nothing', () => {
    const result = { completed: true, completion_time: 1800 }
    expect(allowedActions({ status: 'COMPLETED', result })).toEqual([])
  })

  it('CANCELLED → nothing', () => {
    expect(allowedActions({ status: 'CANCELLED', result: null })).toEqual([])
  })
})
