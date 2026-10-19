import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import StaffPlanningPage from './pages/StaffPlanningPage.jsx'

export const staffRoutes = [
  {
    path: '/staff',
    element: createElement(RequireRole, { role: 'staff' }, createElement(StaffPlanningPage)),
  },
]
