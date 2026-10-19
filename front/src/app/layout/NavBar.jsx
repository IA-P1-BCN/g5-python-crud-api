// Navigation bar: shows only what the current role can access (uses @/features/auth).
import { NavLink } from 'react-router-dom'
import { hasRole, useAuth } from '@/features/auth'
import Button from '@/shared/ui/Button.jsx'
import es from '@/i18n/es.js'

const nav = es.common.nav

// Only links to routes that are registered today. Add a link in the same PR that registers its
// route (admin-stats is still empty).
// `hideFor`: roles that must not see the link (staff and admin work on the planning; staff books with a separate client account).
// No `role` = public. Otherwise the link shows for that role and above (see hasRole).
const links = [
  { to: '/salas', label: nav.rooms, hideFor: ['staff', 'admin'] },
  { to: '/mis-reservas', label: nav.myBookings, role: 'client', hideFor: ['staff', 'admin'] },
  { to: '/historial', label: nav.history, role: 'client', hideFor: ['staff', 'admin'] },
  { to: '/perfil', label: nav.profile, role: 'client' },
  { to: '/staff', label: nav.staff, role: 'staff' },
  { to: '/admin/salas', label: nav.adminRooms, role: 'admin' },
  { to: '/admin/usuarios', label: nav.adminUsers, role: 'admin' },
]

export default function NavBar() {
  const { isAuthenticated, role, loading, logout } = useAuth()
  const visible = links.filter(
    (link) => (!link.role || hasRole(role, link.role)) && !link.hideFor?.includes(role),
  )

  return (
    <nav
      aria-label={nav.label}
      className="border-line bg-bg/60 sticky top-0 z-40 flex items-center gap-6 border-b px-4 py-3 backdrop-blur-md"
    >
      <ul className="flex flex-1 flex-wrap items-center gap-4">
        {visible.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `border-b-2 pb-1 ${isActive ? 'border-exit text-exit' : 'text-text hover:text-exit border-transparent'}`
              }
            >
              {label}
            </NavLink>
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
