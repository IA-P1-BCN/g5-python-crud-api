// Route guard: without a session the user goes to /login. The API stays the real authority.
// Use it as a layout route (<Route element={<RequireAuth />}>) or around children.
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import es from '@/i18n/es.js'
import Spinner from '@/shared/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Session still being restored: do not bounce a logged-in user to /login.
  if (loading) return <Spinner label={es.common.loading} />

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />

  return children ?? <Outlet />
}
