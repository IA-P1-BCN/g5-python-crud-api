import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import AuthProvider from './AuthProvider.jsx'
import RequireAuth from './RequireAuth.jsx'

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('../model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

function renderAt(path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Pantalla de login</p>} />
            <Route element={<RequireAuth />}>
              <Route path="/privada" element={<p>Zona privada</p>} />
            </Route>
            <Route
              path="/envuelta"
              element={
                <RequireAuth>
                  <p>Zona envuelta</p>
                </RequireAuth>
              }
            />
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

describe('RequireAuth', () => {
  it('logged out: redirects to /login and hides the page', async () => {
    renderAt('/privada')

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument()
  })

  it('logged in: shows the page', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderAt('/privada')

    expect(await screen.findByText('Zona privada')).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
  })

  it('also guards the children it wraps', async () => {
    renderAt('/envuelta')
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Zona envuelta')).not.toBeInTheDocument()
  })

  it('while the session is being restored it waits instead of redirecting', () => {
    mocks.auth.getSession.mockReturnValue(new Promise(() => {}))
    renderAt('/privada')

    expect(screen.getByRole('status', { name: es.common.loading })).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument()
  })
})
