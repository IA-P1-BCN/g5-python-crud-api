import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import AdminUsersPage from './pages/AdminUsersPage.jsx'

export const adminUsersRoutes = [
  {
    path: '/admin/usuarios',
    element: createElement(RequireRole, { role: 'admin' }, createElement(AdminUsersPage)),
  },
]
