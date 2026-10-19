import { Link, Navigate, useRoutes } from 'react-router-dom'
import { adminRoomsRoutes } from '@/features/admin-rooms'
import { adminStatsRoutes } from '@/features/admin-stats'
import { adminUsersRoutes } from '@/features/admin-users'
import { authRoutes, RequireAuth } from '@/features/auth'
import { bookingRoutes } from '@/features/booking'
import { dashboardRoutes } from '@/features/dashboard'
import { myBookingsRoutes } from '@/features/my-bookings'
import { profileRoutes } from '@/features/profile'
import { roomsRoutes } from '@/features/rooms'
import { staffRoutes } from '@/features/staff'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import es from '@/i18n/es.js'

function NotFoundPage() {
  const t = es.common.notFound
  return (
    <main className="mx-auto max-w-3xl p-6">
      <EmptyState
        title={t.title}
        description={t.description}
        action={<Link to="/salas">{t.back}</Link>}
      />
    </main>
  )
}

// Only composes the routes owned by each feature. Add routes in features/<name>/routes.js, not here.
// Public: the auth routes (/login, and /register when it exists). Everything else needs a session.
export default function AppRoutes() {
  return useRoutes([
    ...authRoutes,
    {
      element: <RequireAuth />,
      children: [
        { path: '/', element: <Navigate to="/salas" replace /> },
        ...dashboardRoutes,
        ...roomsRoutes,
        ...bookingRoutes,
        ...myBookingsRoutes,
        ...profileRoutes,
        ...staffRoutes,
        ...adminRoomsRoutes,
        ...adminUsersRoutes,
        ...adminStatsRoutes,
        { path: '*', Component: NotFoundPage },
      ],
    },
  ])
}
