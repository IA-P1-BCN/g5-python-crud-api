import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import FakeBanner from './FakeBanner.jsx'

vi.mock('../hooks/useRooms.js', () => ({
  useRooms: () => ({ data: [{ id: 1, name: 'Faro 1923' }] }),
}))

describe('FakeBanner', () => {
  it('shows the title and the room names', () => {
    render(<FakeBanner />)

    expect(screen.getByRole('heading', { name: es.rooms.corridorLabel })).toBeInTheDocument()
    expect(screen.getByText('Faro 1923')).toBeInTheDocument()
  })
})
