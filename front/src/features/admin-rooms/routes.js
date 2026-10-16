import AdminRoomsPage from './pages/AdminRoomsPage'
import AdminSlotsPage from './pages/AdminSlotsPage'

export const adminRoomsRoutes = [
  {
    path: '/admin/salas',
    Component: AdminRoomsPage,
  },
  {
    path: '/admin/salas/:id/horarios',
    Component: AdminSlotsPage,
  },
]
