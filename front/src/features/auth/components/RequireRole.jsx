import { Navigate, useLocation } from 'react-router-dom'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { hasRole } from '../model/roles.js'

export default function RequireRole({ role, children }) {
  const { isAuthenticated, role: userRole, loading, roleError, retryRole, logout } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner label={es.common.loading} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roleError) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <Alert tone="error">{es.auth.roleError}</Alert>
        <div className="mt-4 flex justify-center gap-4">
          <Button onClick={retryRole}>{es.auth.retry}</Button>
          <Button variant="secondary" onClick={logout}>
            {es.common.nav.logout}
          </Button>
        </div>
      </main>
    )
  }

  if (userRole === null) {
    return <Spinner label={es.common.loading} />
  }

  if (!hasRole(userRole, role)) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="heading-title mb-6">{es.auth.forbiddenTitle}</h1>
        <Alert tone="error">{es.common.errors.FORBIDDEN}</Alert>
      </main>
    )
  }

  return children
}
