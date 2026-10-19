import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/features/auth'
import es from '@/i18n/es.js'
import { resetMockUsers } from '@/test/mocks/handlers/adminUsers.js'
import { meDto } from '@/test/mocks/handlers/auth.js'
import { server } from '@/test/mocks/server.js'
import { adminUsersRoutes } from '../routes.js'

// Supabase is mocked (its keys do not exist in tests). /users/me goes through MSW, so the real
// RequireRole decides who sees the page.
const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('@/features/auth/model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

const t = es.adminUsers

function asRole(role) {
  server.use(http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role }))))
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/usuarios" element={adminUsersRoutes[0].element} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const rowOf = (name) => screen.getByRole('row', { name: new RegExp(name) })
const roleSelect = (name) => within(rowOf(name)).getByRole('combobox', { name: t.roleLabel(name) })

// Opens the role selector of a user and picks an option (Radix renders the list in a portal).
async function pickRole(user, name, role) {
  await user.click(roleSelect(name))
  await user.click(await screen.findByRole('option', { name: t.roles[role] }))
}

// jsdom lacks these browser APIs, which Radix Select calls when it opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

beforeEach(() => {
  resetMockUsers()
  mocks.auth.getSession.mockResolvedValue({ data: { session } })
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('AdminUsersPage', () => {
  it('lists the users with a role selector and a deactivate button', async () => {
    asRole('admin')
    renderPage()

    expect(await screen.findByRole('table', { name: t.table.label })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(5) // header + 4 users

    const bruno = within(rowOf('Bruno Cliente'))
    expect(bruno.getByText('bruno@example.com')).toBeInTheDocument()
    expect(roleSelect('Bruno Cliente')).toHaveTextContent(t.roles.client)
    expect(bruno.getByRole('button', { name: t.deactivate })).toBeInTheDocument()

    // A deactivated user shows its state and offers no actions.
    const dani = within(rowOf('Dani Inactivo'))
    expect(dani.getByText(t.status.inactive)).toBeInTheDocument()
    expect(dani.queryByRole('button', { name: t.deactivate })).not.toBeInTheDocument()
    expect(roleSelect('Dani Inactivo')).toBeDisabled()
  })

  it('deactivates a user and the table shows it as inactive', async () => {
    const user = userEvent.setup()
    asRole('admin')
    renderPage()
    await screen.findByRole('table')

    await user.click(within(rowOf('Bruno Cliente')).getByRole('button', { name: t.deactivate }))

    expect(await within(rowOf('Bruno Cliente')).findByText(t.status.inactive)).toBeInTheDocument()
    expect(
      within(rowOf('Bruno Cliente')).queryByRole('button', { name: t.deactivate }),
    ).not.toBeInTheDocument()
  })

  it('changes the role of a user with the selector', async () => {
    const user = userEvent.setup()
    asRole('admin')
    renderPage()
    await screen.findByRole('table')

    await pickRole(user, 'Bruno Cliente', 'staff')

    await waitFor(() => expect(roleSelect('Bruno Cliente')).toHaveTextContent(t.roles.staff))
  })

  it('forbidden: a client does not see the page and the users are never requested', async () => {
    let usersRequested = false
    server.use(
      http.get('/api/v1/users', () => {
        usersRequested = true
        return HttpResponse.json({ items: [], total: 0, page: 1, size: 20 })
      }),
    )
    asRole('client')
    renderPage()

    expect(await screen.findByRole('heading', { name: es.auth.forbiddenTitle })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t.title })).not.toBeInTheDocument()
    expect(usersRequested).toBe(false)
  })

  it('forbidden: if the API answers 403 the page shows the error, not the table', async () => {
    server.use(
      http.get('/api/v1/users', () =>
        HttpResponse.json({ detail: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 }),
      ),
    )
    asRole('admin')
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.common.errors.FORBIDDEN)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows LAST_ADMIN as a message and keeps the user active', async () => {
    const user = userEvent.setup()
    server.use(
      http.put('/api/v1/users/:id/deactivate', () =>
        HttpResponse.json(
          { detail: 'Cannot remove the last active admin', code: 'LAST_ADMIN' },
          { status: 409 },
        ),
      ),
    )
    asRole('admin')
    renderPage()
    await screen.findByRole('table')

    await user.click(within(rowOf('Ana Admin')).getByRole('button', { name: t.deactivate }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.LAST_ADMIN)
    expect(within(rowOf('Ana Admin')).getByText(t.status.active)).toBeInTheDocument()
  })

  it('shows LAST_ADMIN when demoting the last admin and keeps the role', async () => {
    const user = userEvent.setup()
    server.use(
      http.put('/api/v1/users/:id/role', () =>
        HttpResponse.json(
          { detail: 'Cannot remove the last active admin', code: 'LAST_ADMIN' },
          { status: 409 },
        ),
      ),
    )
    asRole('admin')
    renderPage()
    await screen.findByRole('table')

    await pickRole(user, 'Ana Admin', 'client')

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.LAST_ADMIN)
    expect(roleSelect('Ana Admin')).toHaveTextContent(t.roles.admin)
  })
})
