import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { meDto } from '@/test/mocks/handlers/auth.js'
import { server } from '@/test/mocks/server.js'
import AuthProvider from './AuthProvider.jsx'
import RequireRole from './RequireRole.jsx'

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('../model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

// Logged in with the given role: the session exists and /users/me answers with that role.
function signInAs(role) {
  mocks.auth.getSession.mockResolvedValue({ data: { session } })
  server.use(http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role }))))
}

// Logged in, but the API cannot tell us the role.
function signInWithRoleLookupFailing() {
  mocks.auth.getSession.mockResolvedValue({ data: { session } })
  server.use(
    http.get('/api/v1/users/me', () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
    ),
  )
}

function renderGuardedStaffPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/staff']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/staff"
              element={
                <RequireRole role="staff">
                  <p>Zona staff</p>
                </RequireRole>
              }
            />
            <Route path="/login" element={<p>Pantalla de login</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('RequireRole role="staff"', () => {
  it('client: shows the 403 screen and hides the page', async () => {
    signInAs('client')
    renderGuardedStaffPage()

    expect(await screen.findByRole('heading', { name: es.auth.forbiddenTitle })).toBeInTheDocument()
    expect(screen.getByText(es.common.errors.FORBIDDEN)).toBeInTheDocument()
    expect(screen.queryByText('Zona staff')).not.toBeInTheDocument()
  })

  it('staff: shows the page', async () => {
    signInAs('staff')
    renderGuardedStaffPage()

    expect(await screen.findByText('Zona staff')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: es.auth.forbiddenTitle })).not.toBeInTheDocument()
  })

  it('admin: shows the page', async () => {
    signInAs('admin')
    renderGuardedStaffPage()

    expect(await screen.findByText('Zona staff')).toBeInTheDocument()
  })

  it('logged out: redirects to /login', async () => {
    renderGuardedStaffPage()

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Zona staff')).not.toBeInTheDocument()
  })

  it('role lookup fails: shows an error and retrying recovers', async () => {
    signInWithRoleLookupFailing()
    renderGuardedStaffPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(es.auth.roleError)
    expect(screen.queryByText('Zona staff')).not.toBeInTheDocument()

    server.use(http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role: 'staff' }))))
    await userEvent.click(screen.getByRole('button', { name: es.auth.retry }))

    expect(await screen.findByText('Zona staff')).toBeInTheDocument()
  })

  it('role lookup fails: the user can log out', async () => {
    signInWithRoleLookupFailing()
    renderGuardedStaffPage()

    await userEvent.click(await screen.findByRole('button', { name: es.common.nav.logout }))

    expect(mocks.auth.signOut).toHaveBeenCalled()
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })
})
