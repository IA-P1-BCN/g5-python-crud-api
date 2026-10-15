import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { historyItemDto } from '@/test/mocks/handlers/myBookings.js'
import GameHistory from './GameHistory.jsx'

describe('GameHistory', () => {
  it('shows a past game with its result (room, escaped, time as mm:ss)', () => {
    render(<GameHistory games={[historyItemDto()]} />)

    expect(screen.getByText('Faro 1923')).toBeInTheDocument()
    expect(screen.getByText(es.myBookings.history.escaped)).toBeInTheDocument()
    expect(screen.getByText('45:10')).toBeInTheDocument() // 2710 s
  })

  it('shows "result pending" when the game has no result yet', () => {
    render(<GameHistory games={[historyItemDto({ result: null })]} />)

    expect(screen.getByText('Faro 1923')).toBeInTheDocument()
    expect(screen.getByText(es.myBookings.history.noResult)).toBeInTheDocument()
  })
})
