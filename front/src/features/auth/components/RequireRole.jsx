// Route guard: <RequireRole role="staff">. The API stays the real authority.
// Not logged in -> /login. Logged in without enough role -> 403 screen.
// Logged in but the role could not be loaded -> error with retry and logout.
import { Navigate, useLocation } from 'react-router-dom'
import es from '@/i18n/es.js'
import { useAuth } from '../hooks/useAuth.js'
import { hasRole } from '../model/roles.js'

export default function RequireRole({ role, children }) {
  const { isAuthenticated, role: userRole, loading, roleError, retryRole, logout } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p role="status">{es.common.loading}</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Without the role we cannot decide: give the user a way out instead of an endless spinner.
  if (roleError) {
    return (
      <section role="alert" className="mx-auto max-w-xl px-4 py-16 text-center">
        <p>{es.auth.roleError}</p>
        <div className="mt-4 flex justify-center gap-4">
          <button type="button" onClick={() => retryRole()}>
            {es.auth.retry}
          </button>
          <button type="button" onClick={logout}>
            {es.common.nav.logout}
          </button>
        </div>
      </section>
    )
  }

  // Logged in and the role has not arrived yet: do not flash a 403.
  if (userRole === null) {
    return <p role="status">{es.common.loading}</p>
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
