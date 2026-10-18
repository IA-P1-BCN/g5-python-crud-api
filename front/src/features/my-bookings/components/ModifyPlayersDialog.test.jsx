import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import ModifyPlayersDialog from './ModifyPlayersDialog.jsx'

const t = es.myBookings

// bookingDto: 4 players, room capacity 6.
function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ModifyPlayersDialog booking={bookingDto()} open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return onOpenChange
}

describe('ModifyPlayersDialog', () => {
  it('only offers 1 to the room capacity, with the current players selected', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps Save disabled until the number of players changes', async () => {
    renderDialog()
    const save = screen.getByRole('button', { name: t.modifyDialog.save })

    expect(save).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    expect(save).toBeEnabled()
  })

  it('sends the new number of players and closes', async () => {
    let body
    server.use(
      http.put('/api/v1/bookings/1', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(bookingDto({ players: 5 }))
      }),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: t.modifyDialog.save }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(body).toEqual({ players: 5 })
  })

  it('shows the too-late message and stays open when the API refuses (24h rule)', async () => {
    server.use(
      http.put('/api/v1/bookings/1', () =>
        HttpResponse.json(
          { detail: 'Too late to modify', code: 'TOO_LATE_TO_MODIFY' },
          { status: 409 },
        ),
      ),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: t.modifyDialog.save }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.tooLateToModify)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows the invalid-players message and stays open when the API refuses (BR-B2)', async () => {
    server.use(
      http.put('/api/v1/bookings/1', () =>
        HttpResponse.json(
          { detail: 'Players out of range', code: 'INVALID_PLAYERS' },
          { status: 422 },
        ),
      ),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: t.modifyDialog.save }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.invalidPlayers)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
