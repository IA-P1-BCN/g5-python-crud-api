import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { toRoom } from '../model/roomMapper.js'
import RoomPoster from './RoomPoster.jsx'

const room = toRoom(roomDto({ id: 1, slug: 'faro', name: 'Faro 1923', genre: 'Terror marítimo' }))

function renderPoster() {
  return render(
    <MemoryRouter initialEntries={['/salas']}>
      <Routes>
        <Route path="/salas" element={<RoomPoster room={room} />} />
        <Route path="/salas/:slug" element={<p>room detail</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoomPoster', () => {
  it('shows the room name and genre', () => {
    renderPoster()

    expect(screen.getByRole('heading', { name: 'Faro 1923' })).toBeInTheDocument()
    expect(screen.getByText('Terror marítimo')).toBeInTheDocument()
  })

  it('navigates to the room detail page when entering', async () => {
    renderPoster()

    await userEvent.click(screen.getByRole('button', { name: es.rooms.viewDetails }))

    expect(screen.getByText('room detail')).toBeInTheDocument()
  })
})
