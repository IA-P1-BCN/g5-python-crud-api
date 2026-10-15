// Routes of the staff feature: /staff -> StaffPlanningPage (wrap with RequireRole). Route objects { path, Component }; composed in app/routes.jsx.
import StaffPlanningPage from './pages/StaffPlanningPage.jsx'

// TODO(078): wrap with <RequireRole role="staff"> (staff and admin) once the auth feature exists.
export const staffRoutes = [{ path: '/staff', Component: StaffPlanningPage }]
