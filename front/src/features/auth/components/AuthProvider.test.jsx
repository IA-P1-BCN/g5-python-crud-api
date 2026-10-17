import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { server } from '@/test/mocks/server.js'
import { useAuth } from '../hooks/useAuth.js'
import LoginPage from '../pages/LoginPage.jsx'
import AuthProvider from './AuthProvider.jsx'

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

function Probe() {
  const { user, role } = useAuth()
  return (
    <div>
      <p>{user ? user.email : 'Invitado'}</p>
      <p>{role ? `rol:${role}` : 'sin rol'}</p>
    </div>
  )
}

function renderApp(path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/perfil" element={<Probe />} />
            <Route path="/login" element={<LoginPage />} />
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
  mocks.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('AuthProvider', () => {
  it('shows the Google login button and starts the OAuth flow', async () => {
    renderApp('/login')

    await userEvent.click(await screen.findByRole('button', { name: es.auth.google }))

    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  })

  it('logged in: exposes the session and the Axios interceptor sends the JWT', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    let received = null
    server.use(
      http.get('/api/v1/users/me', ({ request }) => {
        received = request.headers.get('Authorization')
        return HttpResponse.json({ id: 'u1', email: 'ana@example.com', role: 'staff' })
      }),
    )

    renderApp('/perfil')

    expect(await screen.findByText('ana@example.com')).toBeInTheDocument()
    expect(await screen.findByText('rol:staff')).toBeInTheDocument()
    expect(received).toBe('Bearer jwt-123')
  })

  it('logged out: no user, no role and no API call', async () => {
    const meSpy = vi.fn()
    server.use(
      http.get('/api/v1/users/me', () => {
        meSpy()
        return HttpResponse.json({})
      }),
    )

    renderApp('/perfil')

    expect(await screen.findByText('Invitado')).toBeInTheDocument()
    expect(screen.getByText('sin rol')).toBeInTheDocument()
    await waitFor(() => expect(mocks.auth.getSession).toHaveBeenCalled())
    expect(meSpy).not.toHaveBeenCalled()
  })

  it('401: signs out and sends the user back to login', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    server.use(
      http.get('/api/v1/users/me', () =>
        HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
      ),
    )

    renderApp('/perfil')

    expect(await screen.findByRole('button', { name: es.auth.google })).toBeInTheDocument()
    expect(mocks.auth.signOut).toHaveBeenCalled()
  })
})
