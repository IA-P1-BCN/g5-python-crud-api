import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { server } from '@/test/mocks/server.js'
import { roomDto } from '@/test/mocks/handlers/rooms.js'
import { DEFAULT_THEME, ROOM_THEMES } from '../model/roomThemes.js'
import RoomsCorridor from './RoomsCorridor.jsx'

// The corridor itself is tested elsewhere: here a stub is enough.
vi.mock('@/features/corridor', async () => {
  const { createElement } = await import('react')
  return {
    CorridorView: ({ rooms, onEnter }) => {
      seenRooms.add(rooms)
      return createElement(
        'button',
        {
          'data-accents': rooms.map((r) => r.accent).join(','),
          onClick: () => onEnter(rooms[0]),
        },
        `corridor:${rooms.map((r) => r.slug).join(',')}`,
      )
    },
  }
})

const seenRooms = new Set()

const respondWith = (body, status = 200) =>
  server.use(http.get('/api/v1/rooms', () => HttpResponse.json(body, { status })))

let client

function renderSection(onEnter = () => {}) {
  seenRooms.clear()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RoomsCorridor onEnter={onEnter} />
    </QueryClientProvider>,
  )
}

describe('RoomsCorridor', () => {
  it('shows a loading status while the rooms are being fetched', () => {
    respondWith([roomDto()])
    renderSection()

    expect(screen.getByRole('status')).toHaveTextContent(es.rooms.loading)
  })

  it('shows the corridor with the visible rooms once loaded', async () => {
    respondWith([
      roomDto({ id: 1, slug: 'faro' }),
      roomDto({ id: 2, slug: 'lab', status: 'inactive' }),
    ])
    renderSection()

    expect(await screen.findByRole('button', { name: 'corridor:faro' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('forwards onEnter with the chosen room', async () => {
    respondWith([roomDto()])
    const onEnter = vi.fn()
    renderSection(onEnter)

    await userEvent.click(await screen.findByRole('button', { name: 'corridor:faro' }))

    expect(onEnter).toHaveBeenCalledWith(expect.objectContaining({ slug: 'faro' }))
  })

  it('gives each room the accent colour of its theme', async () => {
    respondWith([roomDto({ id: 1, slug: 'faro' }), roomDto({ id: 2, slug: 'relojero' })])
    renderSection()

    const corridor = await screen.findByRole('button', { name: 'corridor:faro,relojero' })

    expect(corridor).toHaveAttribute(
      'data-accents',
      `${ROOM_THEMES.faro.accent},${ROOM_THEMES.relojero.accent}`,
    )
  })

  it('falls back to the default accent for a room without theme', async () => {
    respondWith([roomDto({ slug: 'sala-nueva' })])
    renderSection()

    const corridor = await screen.findByRole('button', { name: 'corridor:sala-nueva' })

    expect(corridor).toHaveAttribute('data-accents', DEFAULT_THEME.accent)
  })

  it('shows an alert when the API fails', async () => {
    respondWith({ code: 'INTERNAL_ERROR' }, 500)
    renderSection()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.rooms.loadError)
  })

  it('shows an empty message when no room is visible', async () => {
    respondWith([])
    renderSection()

    expect(await screen.findByText(es.rooms.empty)).toBeInTheDocument()
  })

  it('keeps the same rooms when a refetch changes only fields the scene does not use', async () => {
    respondWith([roomDto({ id: 1, slug: 'faro', story: 'one' })])
    renderSection()
    await screen.findByRole('button', { name: 'corridor:faro' })

    respondWith([roomDto({ id: 1, slug: 'faro', story: 'two' })])
    await act(() => client.refetchQueries({ queryKey: ['rooms'] }))
    expect(client.getQueryData(['rooms', 'active'])[0].story).toBe('two')

    await waitFor(() => expect(client.getQueryState(['rooms', 'active']).fetchStatus).toBe('idle'))
    expect(seenRooms.size).toBe(1)
  })
})
