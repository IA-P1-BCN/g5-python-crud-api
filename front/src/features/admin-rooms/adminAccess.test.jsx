import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/features/auth'
import es from '@/i18n/es.js'
import { adminRoomsHandlers } from '@/test/mocks/handlers/adminRooms.js'
import { meDto } from '@/test/mocks/handlers/auth.js'
import { server } from '@/test/mocks/server.js'
import { adminRoomsRoutes } from './routes.js'

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

function signInAs(role) {
  mocks.auth.getSession.mockResolvedValue({ data: { session } })
  server.use(
    ...adminRoomsHandlers,
    http.get('/api/v1/users/me', () => HttpResponse.json(meDto({ role }))),
  )
}

function renderAt(path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            {adminRoomsRoutes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

describe('admin rooms access (FR-11)', () => {
  it.each(['/admin/salas', '/admin/salas/1/horarios'])(
    'client: sees the 403 screen on %s',
    async (path) => {
      signInAs('client')
      renderAt(path)

      expect(
        await screen.findByRole('heading', { name: es.auth.forbiddenTitle }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: es.adminRooms.title })).not.toBeInTheDocument()
    },
  )

  it('admin: sees the rooms screen', async () => {
    signInAs('admin')
    renderAt('/admin/salas')

    expect(await screen.findByRole('heading', { name: es.adminRooms.title })).toBeInTheDocument()
  })
})
