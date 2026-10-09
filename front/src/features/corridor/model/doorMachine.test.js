import { describe, expect, it } from 'vitest'
import { initialState, transition } from './doorMachine.js'

const idle = initialState
const hover = (id) => transition(idle, { type: 'HOVER', doorId: id })
const selected = (id) => transition(idle, { type: 'SELECT', doorId: id })
const entering = (id) => transition(selected(id), { type: 'ARRIVED' })

describe('doorMachine', () => {
  it('starts idle with no door', () => {
    expect(initialState).toEqual({ status: 'idle', doorId: null })
  })

  it('idle + HOVER -> hover on that door', () => {
    expect(hover('faro')).toEqual({ status: 'hover', doorId: 'faro' })
  })

  it('hover + HOVER on another door -> hover on the new door', () => {
    expect(transition(hover('faro'), { type: 'HOVER', doorId: 'lab' })).toEqual({
      status: 'hover',
      doorId: 'lab',
    })
  })

  it('hover + LEAVE -> idle', () => {
    expect(transition(hover('faro'), { type: 'LEAVE' })).toEqual(idle)
  })

  it('SELECT works from hover and from idle (touch screens)', () => {
    const expected = { status: 'selected', doorId: 'faro' }
    expect(transition(hover('faro'), { type: 'SELECT', doorId: 'faro' })).toEqual(expected)
    expect(selected('faro')).toEqual(expected)
  })

  it('selected + ARRIVED -> entering the same door', () => {
    expect(entering('faro')).toEqual({ status: 'entering', doorId: 'faro' })
  })

  it('selected ignores HOVER, LEAVE and SELECT (no flicker while the camera moves)', () => {
    const s = selected('faro')
    expect(transition(s, { type: 'HOVER', doorId: 'lab' })).toBe(s)
    expect(transition(s, { type: 'LEAVE' })).toBe(s)
    expect(transition(s, { type: 'SELECT', doorId: 'lab' })).toBe(s)
  })

  it('entering ignores everything except RESET', () => {
    const e = entering('faro')
    expect(transition(e, { type: 'HOVER', doorId: 'lab' })).toBe(e)
    expect(transition(e, { type: 'LEAVE' })).toBe(e)
    expect(transition(e, { type: 'SELECT', doorId: 'lab' })).toBe(e)
  })

  it('entering + RESET -> idle (back to the corridor)', () => {
    expect(transition(entering('faro'), { type: 'RESET' })).toEqual(idle)
  })

  it('ARRIVED is ignored unless a door is selected', () => {
    expect(transition(idle, { type: 'ARRIVED' })).toBe(idle)
    const h = hover('faro')
    expect(transition(h, { type: 'ARRIVED' })).toBe(h)
  })

  it('unknown event leaves the state unchanged', () => {
    const h = hover('faro')
    expect(transition(h, { type: 'NOPE' })).toBe(h)
  })
})
