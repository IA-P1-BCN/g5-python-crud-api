import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/features/auth'
import es from '@/i18n/es.js'
import { meDto } from '@/test/mocks/handlers/auth.js'
import { server } from '@/test/mocks/server.js'
import NavBar from './NavBar.jsx'

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('@/features/auth/model/supabaseClient.js', () => ({ supabase: { auth: mocks.auth } }))

const session = {
  access_token: 'jwt-123',
  user: { id: 'u1', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } },
}
const nav = es.common.nav

// Logged in with the given role: the session exists and /users/me answers with that role.
function signInAs(role) {
  mocks.auth.getSession.mockResolvedValue({ data: { session } })
  server.use(http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role }))))
}

function renderNavBar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <NavBar />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const link = (name) => screen.queryByRole('link', { name })

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } })
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mocks.auth.signOut.mockResolvedValue({ error: null })
})

describe('NavBar', () => {
  it('client: only the public and client links', async () => {
    signInAs('client')
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.history })).toBeInTheDocument()
    expect(link(nav.rooms)).toBeInTheDocument()
    expect(link(nav.staff)).not.toBeInTheDocument()
    expect(link(nav.adminRooms)).not.toBeInTheDocument()
    expect(link(nav.adminUsers)).not.toBeInTheDocument()
  })

  it('staff: adds the staff planning but no admin links', async () => {
    signInAs('staff')
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.staff })).toBeInTheDocument()
    expect(link(nav.profile)).toBeInTheDocument()
    expect(link(nav.history)).not.toBeInTheDocument()
    expect(link(nav.myBookings)).not.toBeInTheDocument()
    expect(link(nav.rooms)).not.toBeInTheDocument()
    expect(link(nav.adminRooms)).not.toBeInTheDocument()
  })

  it('admin: shows the management links but not the client ones', async () => {
    signInAs('admin')
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.adminRooms })).toBeInTheDocument()
    expect(link(nav.staff)).toBeInTheDocument()
    expect(link(nav.profile)).toBeInTheDocument()
    expect(link(nav.rooms)).not.toBeInTheDocument()
    expect(link(nav.history)).not.toBeInTheDocument()
    expect(link(nav.myBookings)).not.toBeInTheDocument()
  })

  it.each(['client'])('%s: has Mis reservas to /mis-reservas', async (role) => {
    signInAs(role)
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.myBookings })).toHaveAttribute(
      'href',
      '/mis-reservas',
    )
  })

  it('only the admin sees Usuarios (/admin/usuarios)', async () => {
    signInAs('staff')
    const { unmount } = renderNavBar()
    await screen.findByRole('link', { name: nav.staff })
    expect(link(nav.adminUsers)).not.toBeInTheDocument()
    unmount()

    signInAs('admin')
    renderNavBar()
    expect(await screen.findByRole('link', { name: nav.adminUsers })).toHaveAttribute(
      'href',
      '/admin/usuarios',
    )
  })

  it.each(['client', 'staff', 'admin'])('%s: has the Perfil link to /perfil', async (role) => {
    signInAs(role)
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.profile })).toHaveAttribute(
      'href',
      '/perfil',
    )
  })

  it('logged out: no Perfil link', async () => {
    renderNavBar()

    await screen.findByRole('link', { name: nav.login })
    expect(link(nav.profile)).not.toBeInTheDocument()
  })

  it('logged out: only the public links and the login link', async () => {
    renderNavBar()

    expect(await screen.findByRole('link', { name: nav.login })).toBeInTheDocument()
    expect(link(nav.rooms)).toBeInTheDocument()
    expect(link(nav.history)).not.toBeInTheDocument()
    expect(link(nav.myBookings)).not.toBeInTheDocument()
    expect(link(nav.staff)).not.toBeInTheDocument()
    expect(link(nav.adminRooms)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nav.logout })).not.toBeInTheDocument()
  })
})
