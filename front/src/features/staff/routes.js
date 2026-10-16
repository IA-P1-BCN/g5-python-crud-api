// Routes of the staff feature: /staff -> StaffPlanningPage (staff and admin only). Route objects { path, Component | element }; composed in app/routes.jsx.
import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import StaffPlanningPage from './pages/StaffPlanningPage.jsx'

// This file has no JSX, so the guard is built with createElement.
export const staffRoutes = [
  {
    path: '/staff',
    element: createElement(RequireRole, { role: 'staff' }, createElement(StaffPlanningPage)),
  },
]
