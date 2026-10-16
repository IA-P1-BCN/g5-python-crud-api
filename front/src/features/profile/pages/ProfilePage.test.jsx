import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { historyItemDto } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import ProfilePage from './ProfilePage.jsx'

const t = es.profile

const me = { id: 'u1', email: 'ana@example.com', name: 'Ana', phone: '600123456', role: 'client' }

// GET /users/me, counting the calls (to prove the cached user is refreshed after a save).
function mockMe() {
  const calls = { get: 0 }
  server.use(
    http.get('/api/v1/users/me', () => {
      calls.get += 1
      return HttpResponse.json(me)
    }),
  )
  return calls
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ProfilePage />
    </QueryClientProvider>,
  )
}

describe('ProfilePage - form', () => {
  it('loads GET /users/me: name and phone editable, email read-only', async () => {
    mockMe()
    renderPage()

    expect(await screen.findByLabelText(t.name)).toHaveValue('Ana')
    expect(screen.getByLabelText(t.phone)).toHaveValue('600123456')
    expect(screen.getByLabelText(t.name)).toBeEnabled()
    expect(screen.getByLabelText(t.email)).toHaveValue('ana@example.com')
    expect(screen.getByLabelText(t.email)).toBeDisabled()
  })

  it('saves with PUT /users/me (name and phone only), shows success and refreshes the user', async () => {
    const calls = mockMe()
    let body
    server.use(
      http.put('/api/v1/users/me', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...me, ...body })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    const name = await screen.findByLabelText(t.name)
    await user.clear(name)
    await user.type(name, 'Ana María')
    await user.click(screen.getByRole('button', { name: t.save }))

    expect(await screen.findByText(t.saved)).toBeInTheDocument()
    expect(body).toEqual({ name: 'Ana María', phone: '600123456' })
    await waitFor(() => expect(calls.get).toBe(2)) // refetched after the save
  })

  it('shows the Zod message (not the browser bubble) and does not call the API', async () => {
    mockMe()
    let putCalled = false
    server.use(
      http.put('/api/v1/users/me', () => {
        putCalled = true
        return HttpResponse.json(me)
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.clear(await screen.findByLabelText(t.name))
    await user.click(screen.getByRole('button', { name: t.save }))

    expect(await screen.findByText(t.nameRequired)).toBeInTheDocument()
    expect(putCalled).toBe(false)
  })

  it('shows an error Alert when the API fails on save', async () => {
    mockMe()
    server.use(
      http.put('/api/v1/users/me', () =>
        HttpResponse.json({ detail: 'boom', code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: t.save }))

    expect(await screen.findByRole('alert')).toHaveTextContent(es.common.errors.unknown)
  })
})

const game = (completed, completion_time) =>
  historyItemDto({ result: { completed, completion_time } })

const mockHistory = (items) =>
  server.use(http.get('/api/v1/users/me/history', () => HttpResponse.json(items)))

// The <dd> number that goes with a label ("partidas", "escapadas"...).
const statValue = (label) => {
  const region = screen.getByRole('region', { name: t.scoreTitle })
  return within(region).getByText(label).closest('div').querySelector('dd')
}

describe('ProfilePage - score', () => {
  it('shows games played, games escaped and best time from the history', async () => {
    mockMe()
    // Best time = fastest ESCAPED game: the lost 600 s one must not count.
    mockHistory([game(true, 2710), game(true, 1805), game(false, 600)])
    renderPage()

    await screen.findByRole('region', { name: t.scoreTitle })
    await waitFor(() => expect(statValue(t.played).textContent).toBe('3'))
    expect(statValue(t.escaped).textContent).toBe('2')
    expect(statValue(t.bestTime).textContent).toBe('30:05')
  })

  it('shows 0 / 0 / "-" when there is no finished game', async () => {
    mockMe()
    mockHistory([])
    renderPage()

    await screen.findByRole('region', { name: t.scoreTitle })
    await waitFor(() => expect(statValue(t.bestTime).textContent).toBe('-'))
    expect(statValue(t.played).textContent).toBe('0')
    expect(statValue(t.escaped).textContent).toBe('0')
  })
})
