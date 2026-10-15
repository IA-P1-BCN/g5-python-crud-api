// Routes of the admin-rooms feature: /admin/salas -> AdminRoomsPage, /admin/salas/:id/horarios -> AdminSlotsPage (wrap with RequireRole). Route objects { path, Component }; composed in app/routes.jsx.

import AdminRoomsPage from './pages/AdminRoomsPage';
import AdminSlotsPage from './pages/AdminSlotsPage';
import { RequireRole } from '@/components/RequireRole';

export const adminRoomsRoutes = [
  {
    path: '/admin/salas',
    Component: AdminRoomsPage,
  },
  {
    path: '/admin/salas/:id/horarios',
    Component: () => (
      <RequireRole>
        <AdminSlotsPage />
      </RequireRole>
    ),
  },
];