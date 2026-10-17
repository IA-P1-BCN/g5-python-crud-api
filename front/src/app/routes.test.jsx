import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, vi } from 'vitest'
import { AuthProvider } from '@/features/auth'
import es from '@/i18n/es.js'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { adminRoomsRoutes } from '@/features/admin-rooms'
import { adminStatsRoutes } from '@/features/admin-stats'
import { adminUsersRoutes } from '@/features/admin-users'
import { authRoutes } from '@/features/auth'
import { bookingRoutes } from '@/features/booking'
import { dashboardRoutes } from '@/features/dashboard'
import { myBookingsRoutes } from '@/features/my-bookings'
import { profileRoutes } from '@/features/profile'
import { roomsRoutes } from '@/features/rooms'
import { staffRoutes } from '@/features/staff'
import AppRoutes from './routes.jsx'

describe('each feature owns its routes', () => {
  it.each([
    ['rooms', roomsRoutes],
    ['booking', bookingRoutes],
    ['dashboard', dashboardRoutes],
    ['my-bookings', myBookingsRoutes],
    ['auth', authRoutes],
    ['profile', profileRoutes],
    ['staff', staffRoutes],
    ['admin-rooms', adminRoomsRoutes],
    ['admin-users', adminUsersRoutes],
    ['admin-stats', adminStatsRoutes],
  ])('%s exports a routes array', (_name, routes) => {
    expect(Array.isArray(routes)).toBe(true)
  })

  it('rooms owns /salas and /salas/:slug', () => {
    expect(roomsRoutes.map((route) => route.path)).toEqual(['/salas', '/salas/:slug'])
  })
})

// Supabase is mocked (its keys do not exist in tests). /users/me goes through the MSW handler.
const mocks = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn() },
}))
vi.mock('@/features/auth/model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}

function renderApp(path) {
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

describe('private routes', () => {
  beforeEach(() => {
    mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
    mocks.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mocks.auth.signOut.mockResolvedValue({ error: null })
  })

  it('with a session the home page renders', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Escape rooms' })).toBeInTheDocument()
  })

  it('without a session the home page redirects to /login', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: es.auth.title })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Escape rooms' })).not.toBeInTheDocument()
  })

  it('/dashboard without a session redirects to /login', async () => {
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { name: es.auth.title })).toBeInTheDocument()
  })

  it('/dashboard renders for a logged-in user', async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session } })
    renderApp('/dashboard')

    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument()
  })

  it('/login stays public', async () => {
    renderApp('/login')

    expect(await screen.findByRole('heading', { name: es.auth.title })).toBeInTheDocument()
  })
})
