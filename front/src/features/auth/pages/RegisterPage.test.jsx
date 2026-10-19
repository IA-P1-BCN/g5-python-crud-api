import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import AuthProvider from '../components/AuthProvider.jsx'
import RequireAuth from '../components/RequireAuth.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { authRoutes } from '../routes.js'

// Supabase is mocked (its keys do not exist in tests). /users/me goes through the MSW handler.
const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('../model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const t = es.auth.register
const v = t.validation

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

// Stands in for /dashboard: it proves the session reached the context.
function Dashboard() {
  const { user } = useAuth()
  return <p>{`Panel de ${user?.email}`}</p>
}

// Same shape as app/routes.jsx: the auth routes are public, everything else is behind RequireAuth.
function AppRoutes() {
  return useRoutes([
    ...authRoutes,
    { element: <RequireAuth />, children: [{ path: '/dashboard', element: <Dashboard /> }] },
  ])
}

function renderAt(path = '/register') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const field = {
  name: () => screen.getByLabelText(t.name),
  email: () => screen.getByLabelText(es.auth.email),
  password: () => screen.getByLabelText(es.auth.password),
  confirm: () => screen.getByLabelText(t.confirmPassword),
  submit: () => screen.getByRole('button', { name: t.submit }),
}

async function fillAndSubmit(
  user,
  { name = 'Ana', email = 'ana@example.com', password = 'secreto123', confirm = password } = {},
) {
  await user.type(await screen.findByLabelText(t.name), name)
  await user.type(field.email(), email)
  await user.type(field.password(), password)
  await user.type(field.confirm(), confirm)
  await user.click(field.submit())
}

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
  mocks.auth.signInWithPassword.mockReset()
  mocks.auth.signUp.mockReset()
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('RegisterPage', () => {
  it('validates the form inline before calling Supabase', async () => {
    const user = userEvent.setup()
    renderAt()

    // Empty form: every field asks for its value.
    await user.click(await screen.findByRole('button', { name: t.submit }))
    expect(await screen.findByText(v.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(es.auth.validation.emailRequired)).toBeInTheDocument()
    expect(screen.getByText(es.auth.validation.passwordRequired)).toBeInTheDocument()
    expect(screen.getByText(v.confirmRequired)).toBeInTheDocument()

    // Bad email and short password.
    await user.type(field.name(), 'Ana')
    await user.type(field.email(), 'no-es-un-correo')
    await user.type(field.password(), 'corta')
    await user.type(field.confirm(), 'corta')
    await user.click(field.submit())
    expect(await screen.findByText(es.auth.validation.emailInvalid)).toBeInTheDocument()
    expect(screen.getByText(v.passwordMin)).toBeInTheDocument()

    // Valid email and password, but the confirmation differs.
    await user.clear(field.email())
    await user.type(field.email(), 'ana@example.com')
    await user.clear(field.password())
    await user.type(field.password(), 'secreto123')
    await user.click(field.submit())
    expect(await screen.findByText(v.passwordsMismatch)).toBeInTheDocument()

    expect(mocks.auth.signUp).not.toHaveBeenCalled()
  })

  it('successful sign-up creates the account and redirects to /dashboard', async () => {
    const user = userEvent.setup()
    mocks.auth.signUp.mockImplementation(async () => {
      // From now on the Axios interceptor finds the token, like with the real client.
      mocks.auth.getSession.mockResolvedValue({ data: { session } })
      return { data: { session, user: session.user }, error: null }
    })
    renderAt()

    await fillAndSubmit(user)

    expect(await screen.findByText('Panel de ana@example.com')).toBeInTheDocument()
    // The name travels as metadata; the confirmation field is never sent.
    expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secreto123',
      options: { data: { full_name: 'Ana' } },
    })
  })

  it('duplicate email: shows the DUPLICATE message and stays on /register', async () => {
    const user = userEvent.setup()
    mocks.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'User already registered', code: 'user_already_exists', status: 422 },
    })
    renderAt()

    await fillAndSubmit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(t.duplicate)
    expect(screen.getByLabelText(t.name)).toBeInTheDocument()
    expect(screen.queryByText(/^Panel de/)).not.toBeInTheDocument()
  })

  it('duplicate email that Supabase hides (no error, no identities) is also reported', async () => {
    const user = userEvent.setup()
    mocks.auth.signUp.mockResolvedValue({
      data: { session: null, user: { id: 'u9', identities: [] } },
      error: null,
    })
    renderAt()

    await fillAndSubmit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(t.duplicate)
    expect(screen.getByLabelText(t.name)).toBeInTheDocument()
  })

  it('unexpected error: shows a generic message and stays on /register', async () => {
    const user = userEvent.setup()
    mocks.auth.signUp.mockRejectedValue(new Error('Failed to fetch'))
    renderAt()

    await fillAndSubmit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(t.error)
    expect(screen.getByLabelText(t.name)).toBeInTheDocument()
  })

  it('when Supabase needs the email confirmed it says so instead of redirecting', async () => {
    const user = userEvent.setup()
    mocks.auth.signUp.mockResolvedValue({
      data: { session: null, user: { id: 'u2', identities: [{ id: 'i1' }] } },
      error: null,
    })
    renderAt()

    await fillAndSubmit(user)

    expect(await screen.findByRole('status')).toHaveTextContent(t.checkEmail)
    expect(screen.queryByText(/^Panel de/)).not.toBeInTheDocument()
  })

  it('/register is public: a visitor sees the form, not the login page', async () => {
    renderAt('/register')

    expect(await screen.findByRole('heading', { name: t.title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: es.auth.title })).not.toBeInTheDocument()
  })

  it('a user who is already logged in is redirected to /dashboard', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderAt('/register')

    expect(await screen.findByText('Panel de ana@example.com')).toBeInTheDocument()
    expect(screen.queryByLabelText(t.name)).not.toBeInTheDocument()
  })

  it('links /register and /login to each other', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.click(await screen.findByRole('link', { name: es.auth.registerLink }))
    expect(await screen.findByRole('heading', { name: t.title })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: t.loginLink }))
    expect(await screen.findByRole('heading', { name: es.auth.title })).toBeInTheDocument()
  })
})
