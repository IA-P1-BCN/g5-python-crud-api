import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import CorridorFallback from './CorridorFallback.jsx'

const faro = { id: 3, slug: 'faro', name: 'Faro 1923', genre: 'Terror marítimo' }
const relojero = { id: 1, slug: 'relojero', name: 'El Relojero', genre: 'Misterio victoriano' }

describe('CorridorFallback', () => {
  it('lists one entry per room in a labelled list', () => {
    render(<CorridorFallback rooms={[faro, relojero]} onEnter={() => {}} />)

    const list = screen.getByRole('list', { name: es.rooms.corridorLabel })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })

  it('shows the name and the genre of each room', () => {
    render(<CorridorFallback rooms={[faro]} onEnter={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Faro 1923' })).toBeInTheDocument()
    expect(screen.getByText('Terror marítimo')).toBeInTheDocument()
  })

  it('applies the room theme through data-room (default theme for unknown slugs)', () => {
    render(<CorridorFallback rooms={[faro]} onEnter={() => {}} />)

    expect(screen.getByRole('listitem')).toHaveAttribute('data-room', 'faro')
  })

  it('calls onEnter with the room when its button is clicked', async () => {
    render(<CorridorFallback rooms={[faro]} onEnter={() => {}} />)

    expect(screen.getByRole('listitem')).toHaveAttribute('data-room', 'faro')
  })

  it('calls onEnter with the room when its button is clicked', async () => {
    const onEnter = vi.fn()
    render(<CorridorFallback rooms={[faro, relojero]} onEnter={onEnter} />)

    await userEvent.click(screen.getByRole('button', { name: es.rooms.enter('El Relojero') }))

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onEnter).toHaveBeenCalledWith(relojero)
  })

  it('can be used with the keyboard only', async () => {
    const onEnter = vi.fn()
    render(<CorridorFallback rooms={[faro]} onEnter={onEnter} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onEnter).toHaveBeenCalledWith(faro)
  })

  it('renders an empty list without crashing', () => {
    render(<CorridorFallback rooms={[]} onEnter={() => {}} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
