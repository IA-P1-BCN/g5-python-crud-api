import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Corridor from './Corridor.jsx'
import { createCorridor } from '../scene/createCorridor.js'

// Three.js needs WebGL (not available in jsdom): the scene factory is replaced by a fake.
vi.mock('../scene/createCorridor.js', () => ({ createCorridor: vi.fn() }))

const faro = { id: 3, slug: 'faro', name: 'Faro 1923' }
const relojero = { id: 1, slug: 'relojero', name: 'El Relojero' }

let dispose

beforeEach(() => {
  dispose = vi.fn()
  createCorridor.mockReset()
  createCorridor.mockReturnValue({ dispose })
})

describe('Corridor', () => {
  it('creates the scene once, in its container, with the rooms', () => {
    const { container } = render(<Corridor rooms={[faro]} onEnter={() => {}} />)

    expect(createCorridor).toHaveBeenCalledTimes(1)
    expect(createCorridor).toHaveBeenCalledWith(
      container.firstChild,
      expect.objectContaining({ rooms: [faro] }),
    )
  })

  it('disposes the scene on unmount', () => {
    const { unmount } = render(<Corridor rooms={[faro]} onEnter={() => {}} />)
    expect(dispose).not.toHaveBeenCalled()

    unmount()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('disposes the old scene and creates a new one when the rooms change', () => {
    const { rerender } = render(<Corridor rooms={[faro]} onEnter={() => {}} />)

    rerender(<Corridor rooms={[faro, relojero]} onEnter={() => {}} />)

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(createCorridor).toHaveBeenCalledTimes(2)
    expect(createCorridor.mock.calls[1][1].rooms).toEqual([faro, relojero])
  })

  it('calls onEnter with the room chosen in the scene', () => {
    const onEnter = vi.fn()
    render(<Corridor rooms={[faro]} onEnter={onEnter} />)

    createCorridor.mock.calls[0][1].onEnter(faro)

    expect(onEnter).toHaveBeenCalledWith(faro)
  })

  it('uses the latest onEnter without recreating the scene', () => {
    const first = vi.fn()
    const second = vi.fn()
    const rooms = [faro]
    const { rerender } = render(<Corridor rooms={rooms} onEnter={first} />)

    rerender(<Corridor rooms={rooms} onEnter={second} />)
    createCorridor.mock.calls[0][1].onEnter(faro)

    expect(createCorridor).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(faro)
  })

  it('reports a failure to build the scene instead of throwing', () => {
    const failure = new Error('Error creating WebGL context')
    createCorridor.mockImplementation(() => {
      throw failure
    })
    const onError = vi.fn()

    render(<Corridor rooms={[faro]} onEnter={() => {}} onError={onError} />)

    expect(onError).toHaveBeenCalledWith(failure)
  })
})
