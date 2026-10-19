import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import AdminRoomsPage from './pages/AdminRoomsPage'
import AdminSlotsPage from './pages/AdminSlotsPage'

// No JSX in this file, so the admin-only guard is built with createElement.
const adminOnly = (Page) => createElement(RequireRole, { role: 'admin' }, createElement(Page))

export const adminRoomsRoutes = [
  { path: '/admin/salas', element: adminOnly(AdminRoomsPage) },
  { path: '/admin/salas/:id/horarios', element: adminOnly(AdminSlotsPage) },
]
