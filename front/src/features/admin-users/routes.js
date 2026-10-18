// Routes of the admin-users feature: /admin/usuarios -> AdminUsersPage (admin only). Route objects { path, element }; composed in app/routes.jsx.
import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import AdminUsersPage from './pages/AdminUsersPage.jsx'

// This file has no JSX, so the guard is built with createElement.
export const adminUsersRoutes = [
  {
    path: '/admin/usuarios',
    element: createElement(RequireRole, { role: 'admin' }, createElement(AdminUsersPage)),
  },
]
