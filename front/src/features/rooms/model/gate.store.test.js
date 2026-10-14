import { beforeEach, describe, expect, it } from 'vitest'
import { useGateStore } from './gate.store.js'

const room = { slug: 'faro' }

beforeEach(() => useGateStore.getState().reset())

describe('gate store', () => {
  it('is idle at first', () => {
    expect(useGateStore.getState()).toMatchObject({ room: null, phase: null })
  })

  it('start() covers the screen with the chosen room', () => {
    useGateStore.getState().start(room)
    expect(useGateStore.getState()).toMatchObject({ room, phase: 'cover' })
  })

  it('uncover() keeps the room but reveals the new page', () => {
    useGateStore.getState().start(room)
    useGateStore.getState().uncover()
    expect(useGateStore.getState()).toMatchObject({ room, phase: 'uncover' })
  })

  it('reset() goes back to idle', () => {
    useGateStore.getState().start(room)
    useGateStore.getState().reset()
    expect(useGateStore.getState()).toMatchObject({ room: null, phase: null })
  })
})
