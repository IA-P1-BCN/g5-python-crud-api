// Route guard: <RequireRole role="staff">. The API stays the real authority.
// Not logged in -> /login. Logged in without enough role -> 403 screen.
import { Navigate, useLocation } from 'react-router-dom'
import es from '@/i18n/es.js'
import { useAuth } from '../hooks/useAuth.js'
import { hasRole } from '../model/roles.js'

export default function RequireRole({ role, children }) {
  const { isAuthenticated, role: userRole, loading } = useAuth()
  const location = useLocation()

  // Session still restoring, or logged in but the role has not arrived yet: do not flash a 403.
  if (loading || (isAuthenticated && userRole === null)) {
    return <p role="status">{es.common.loading}</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRole(userRole, role)) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{es.auth.forbiddenTitle}</h1>
        <p className="mt-2">{es.common.errors.FORBIDDEN}</p>
      </section>
    )
  }

  return children
}
