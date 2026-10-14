import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireAnimationEnd, stubMatchMedia } from '@/test/motion.js'
import { useGateStore } from '../model/gate.store.js'
import GateLayer from './GateLayer.jsx'

function renderLayer() {
  return render(
    <MemoryRouter initialEntries={['/salas']}>
      <Routes>
        <Route path="/salas" element={<p>list</p>} />
        <Route path="/salas/:slug" element={<p>room detail</p>} />
      </Routes>
      <GateLayer />
    </MemoryRouter>,
  )
}

const enter = () => act(() => useGateStore.getState().start({ slug: 'faro' }))

beforeEach(() => useGateStore.getState().reset())
afterEach(() => {
  delete window.matchMedia
})

describe('GateLayer', () => {
  it('renders nothing while idle', () => {
    stubMatchMedia(false)
    renderLayer()
    expect(screen.queryByTestId('gate')).not.toBeInTheDocument()
  })

  it('covers, swaps the page behind the gate, then uncovers progressively', () => {
    stubMatchMedia(false)
    renderLayer()
    enter()

    expect(screen.getByTestId('gate')).toHaveAttribute('data-phase', 'cover')
    expect(screen.queryByText('room detail')).not.toBeInTheDocument()

    fireAnimationEnd(screen.getByTestId('gate'))

    // same gate element stays on screen while the new page is already there
    expect(screen.getByText('room detail')).toBeInTheDocument()
    expect(screen.getByTestId('gate')).toHaveAttribute('data-phase', 'uncover')

    fireAnimationEnd(screen.getByTestId('gate'), 'gate-uncover')

    expect(screen.queryByTestId('gate')).not.toBeInTheDocument()
  })

  it('goes straight to the room, without gate, under reduced motion', () => {
    stubMatchMedia(true)
    renderLayer()
    enter()

    expect(screen.getByText('room detail')).toBeInTheDocument()
    expect(screen.queryByTestId('gate')).not.toBeInTheDocument()
    expect(useGateStore.getState().phase).toBeNull()
  })
})
