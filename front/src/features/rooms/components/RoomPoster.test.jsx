import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { toRoom } from '../model/roomMapper.js'
import RoomPoster from './RoomPoster.jsx'

const room = toRoom(roomDto({ id: 1, slug: 'faro', name: 'Faro 1923', genre: 'Terror marítimo' }))

describe('RoomPoster', () => {
  it('shows the room name and genre', () => {
    render(<RoomPoster room={room} onEnter={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Faro 1923' })).toBeInTheDocument()
    expect(screen.getByText('Terror marítimo')).toBeInTheDocument()
  })

  it('calls onEnter with the room when entering', async () => {
    const onEnter = vi.fn()
    render(<RoomPoster room={room} onEnter={onEnter} />)

    await userEvent.click(screen.getByRole('button', { name: es.rooms.viewDetails }))

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onEnter).toHaveBeenCalledWith(room)
  })
})
