import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { meDto } from '@/test/mocks/handlers/auth.js'
import { server } from '@/test/mocks/server.js'
import AuthProvider from '../components/AuthProvider.jsx'
import { useAuth } from '../hooks/useAuth.js'
import LoginPage from './LoginPage.jsx'

// Supabase is mocked (its keys do not exist in tests). /users/me goes through the MSW handler.
const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('../model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

// Stands in for /salas: it proves the session reached the context.
function Salas() {
  const { user } = useAuth()
  return <p>{`Panel de ${user?.email}`}</p>
}

function renderLogin(path = '/login') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/salas" element={<Salas />} />
            <Route path="/staff" element={<p>Planning de hoy</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillAndSubmit(user, { email, password }) {
  await user.type(await screen.findByLabelText(es.auth.email), email)
  await user.type(screen.getByLabelText(es.auth.password), password)
  await user.click(screen.getByRole('button', { name: es.auth.submit }))
}

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
  mocks.auth.signInWithPassword.mockReset()
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('LoginPage', () => {
  it('validates email and password inline before calling Supabase', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(await screen.findByRole('button', { name: es.auth.submit }))
    expect(await screen.findByText(es.auth.validation.emailRequired)).toBeInTheDocument()
    expect(screen.getByText(es.auth.validation.passwordRequired)).toBeInTheDocument()

    await user.type(screen.getByLabelText(es.auth.email), 'no-es-un-correo')
    await user.click(screen.getByRole('button', { name: es.auth.submit }))
    expect(await screen.findByText(es.auth.validation.emailInvalid)).toBeInTheDocument()
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('successful login stores the session and redirects to /salas', async () => {
    const user = userEvent.setup()
    mocks.auth.signInWithPassword.mockImplementation(async () => {
      // From now on the Axios interceptor finds the token, like with the real client.
      mocks.auth.getSession.mockResolvedValue({ data: { session } })
      return { data: { session, user: session.user }, error: null }
    })
    renderLogin()

    await fillAndSubmit(user, { email: 'ana@example.com', password: 'secreto123' })

    expect(await screen.findByText('Panel de ana@example.com')).toBeInTheDocument()
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secreto123',
    })
  })

  it('wrong credentials: shows the error and stays on /login', async () => {
    const user = userEvent.setup()
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 },
    })
    renderLogin()

    await fillAndSubmit(user, { email: 'ana@example.com', password: 'mal-puesta' })

    expect(await screen.findByRole('alert')).toHaveTextContent(es.auth.invalidCredentials)
    expect(screen.getByLabelText(es.auth.email)).toBeInTheDocument()
    expect(screen.queryByText(/^Panel de/)).not.toBeInTheDocument()
  })

  it('unexpected error: shows a generic message and stays on /login', async () => {
    const user = userEvent.setup()
    mocks.auth.signInWithPassword.mockRejectedValue(new Error('Failed to fetch'))
    renderLogin()

    await fillAndSubmit(user, { email: 'ana@example.com', password: 'secreto123' })

    expect(await screen.findByRole('alert')).toHaveTextContent(es.auth.loginError)
    expect(screen.getByLabelText(es.auth.email)).toBeInTheDocument()
  })

  it('a user who is already logged in is redirected to /salas', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderLogin('/login')

    expect(await screen.findByText('Panel de ana@example.com')).toBeInTheDocument()
    expect(screen.queryByLabelText(es.auth.email)).not.toBeInTheDocument()
  })

  it.each(['staff', 'admin'])('a logged-in %s lands on the planning (/staff)', async (role) => {
    server.use(http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role }))))
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderLogin('/login')

    expect(await screen.findByText('Planning de hoy')).toBeInTheDocument()
  })
})
