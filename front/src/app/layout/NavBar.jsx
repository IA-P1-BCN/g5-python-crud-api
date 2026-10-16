// Navigation bar: shows only what the current role can access (uses @/features/auth).
import { NavLink } from 'react-router-dom'
import { hasRole, useAuth } from '@/features/auth'
import Button from '@/shared/ui/Button.jsx'
import es from '@/i18n/es.js'

const nav = es.common.nav

// Only links to routes that are registered today. Add a link in the same PR that registers its
// route (my-bookings list, profile, admin-users and admin-stats are still empty).
// No `role` = public. Otherwise the link shows for that role and above (see hasRole).
const links = [
  { to: '/salas', label: nav.rooms },
  { to: '/historial', label: nav.history, role: 'client' },
  { to: '/staff', label: nav.staff, role: 'staff' },
  { to: '/admin/salas', label: nav.adminRooms, role: 'admin' },
]

export default function NavBar() {
  const { isAuthenticated, role, loading, logout } = useAuth()
  const visible = links.filter((link) => !link.role || hasRole(role, link.role))

  return (
    <nav
      aria-label={nav.label}
      className="border-border flex items-center gap-6 border-b px-4 py-3"
    >
      <ul className="flex flex-1 flex-wrap items-center gap-4">
        {visible.map(({ to, label }) => (
          <li key={to}>
            <NavLink to={to}>{label}</NavLink>
          </li>
        ))}
      </ul>
      {/* Wait for the session to be restored, so "Acceder" does not flash for a logged-in user. */}
      {loading ? null : isAuthenticated ? (
        <Button variant="ghost" onClick={logout}>
          {nav.logout}
        </Button>
      ) : (
        <NavLink to="/login">{nav.login}</NavLink>
      )}
    </nav>
  )
}
