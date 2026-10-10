import { describe, expect, it } from 'vitest'
import { getArrivalEvent, getHoverEvent } from './frameEvents.js'

const idle = { status: 'idle', doorId: null }
const hovering = (doorId) => ({ status: 'hover', doorId })
const selected = (doorId) => ({ status: 'selected', doorId })
const near = () => true
const far = () => false

describe('getHoverEvent', () => {
  it('hovers the door under the pointer', () => {
    expect(getHoverEvent(idle, 3, far)).toEqual({ type: 'HOVER', doorId: 3 })
  })

  it('moves the hover to another door under the pointer', () => {
    expect(getHoverEvent(hovering(3), 5, far)).toEqual({ type: 'HOVER', doorId: 5 })
  })

  it('does nothing while the pointer stays on the hovered door', () => {
    expect(getHoverEvent(hovering(3), 3, far)).toBeNull()
  })

  it('does nothing when no door is under the pointer and none is hovered', () => {
    expect(getHoverEvent(idle, null, far)).toBeNull()
  })

  it('keeps the hover while the pointer is still near the door on screen', () => {
    expect(getHoverEvent(hovering(3), null, near)).toBeNull()
  })

  it('leaves the door once the pointer is away from it', () => {
    expect(getHoverEvent(hovering(3), null, far)).toEqual({ type: 'LEAVE' })
  })

  it('does not check the pointer distance when it is not needed', () => {
    const neverCalled = () => {
      throw new Error('should not be called')
    }

    expect(getHoverEvent(idle, null, neverCalled)).toBeNull()
    expect(getHoverEvent(hovering(3), 3, neverCalled)).toBeNull()
  })

  it('ignores the pointer once a door has been chosen', () => {
    expect(getHoverEvent(selected(3), 5, far)).toBeNull()
    expect(getHoverEvent({ status: 'entering', doorId: 3 }, null, far)).toBeNull()
  })
})

describe('getArrivalEvent', () => {
  it('arrives once the camera almost faces the selected door', () => {
    expect(getArrivalEvent(selected(3), 0.99)).toEqual({ type: 'ARRIVED' })
  })

  it('waits while the camera is still turning', () => {
    expect(getArrivalEvent(selected(3), 0.9)).toBeNull()
  })

  it('only arrives from the selected state', () => {
    expect(getArrivalEvent(hovering(3), 1)).toBeNull()
    expect(getArrivalEvent({ status: 'entering', doorId: 3 }, 1)).toBeNull()
  })
})
