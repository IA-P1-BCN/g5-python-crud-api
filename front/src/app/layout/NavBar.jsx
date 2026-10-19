import { NavLink } from 'react-router-dom'
import { hasRole, useAuth } from '@/features/auth'
import Button from '@/shared/ui/Button.jsx'
import es from '@/i18n/es.js'

const nav = es.common.nav

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
