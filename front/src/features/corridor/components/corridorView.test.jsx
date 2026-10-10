import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import CorridorView from './CorridorView.jsx'

// The real 3D component needs WebGL (not available in jsdom): replace it with a stub.
vi.mock('./Corridor.jsx', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ rooms, onEnter, onError }) =>
      createElement(
        'div',
        null,
        createElement(
          'button',
          { 'data-testid': 'corridor-3d', onClick: () => onEnter(rooms[0]) },
          `3D:${rooms.map((r) => r.slug).join(',')}`,
        ),
        createElement('button', { 'data-testid': 'break-3d', onClick: () => onError(new Error()) }),
      ),
  }
})

const faro = { id: 3, slug: 'faro', name: 'Faro 1923', genre: 'Terror marítimo' }
const relojero = { id: 1, slug: 'relojero', name: 'El Relojero', genre: 'Misterio victoriano' }

function setEnvironment({ webgl = true, reducedMotion = false, smallScreen = false } = {}) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(webgl ? {} : null)
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : smallScreen,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
  delete window.matchMedia
})

describe('CorridorView', () => {
  it('shows the 3D corridor with the rooms when the environment allows it', () => {
    setEnvironment()
    render(<CorridorView rooms={[faro, relojero]} onEnter={() => {}} />)

    expect(screen.getByTestId('corridor-3d')).toHaveTextContent('3D:faro,relojero')
  })

  it('keeps a keyboard and screen-reader path to the rooms next to the 3D corridor', async () => {
    setEnvironment()
    const onEnter = vi.fn()
    render(<CorridorView rooms={[faro]} onEnter={onEnter} />)

    await userEvent.click(screen.getByRole('button', { name: es.rooms.enter('Faro 1923') }))

    expect(screen.getByRole('list', { name: es.rooms.corridorLabel })).toBeInTheDocument()
    expect(onEnter).toHaveBeenCalledWith(faro)
  })

  it('drops the 3D corridor and shows the poster grid when the scene fails to start', async () => {
    setEnvironment()
    render(<CorridorView rooms={[faro]} onEnter={() => {}} />)

    await userEvent.click(screen.getByTestId('break-3d'))

    expect(screen.queryByTestId('corridor-3d')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: es.rooms.corridorLabel })).toBeInTheDocument()
  })

  it.each([
    ['WebGL is missing', { webgl: false }],
    ['the user prefers reduced motion', { reducedMotion: true }],
    ['the screen is small', { smallScreen: true }],
  ])('shows the poster grid instead of the 3D when %s', (_label, environment) => {
    setEnvironment(environment)
    render(<CorridorView rooms={[faro]} onEnter={() => {}} />)

    expect(screen.getByRole('list', { name: es.rooms.corridorLabel })).toBeInTheDocument()
    expect(screen.queryByTestId('corridor-3d')).not.toBeInTheDocument()
  })

  it('passes onEnter to the 3D corridor', async () => {
    setEnvironment()
    const onEnter = vi.fn()
    render(<CorridorView rooms={[faro]} onEnter={onEnter} />)

    await userEvent.click(screen.getByTestId('corridor-3d'))

    expect(onEnter).toHaveBeenCalledWith(faro)
  })

  it('passes onEnter to the poster grid', async () => {
    setEnvironment({ webgl: false })
    const onEnter = vi.fn()
    render(<CorridorView rooms={[faro]} onEnter={onEnter} />)

    await userEvent.click(screen.getByRole('button', { name: es.rooms.enter('Faro 1923') }))

    expect(onEnter).toHaveBeenCalledWith(faro)
  })
})
