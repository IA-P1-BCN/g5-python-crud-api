// Routes of the profile feature: /perfil -> ProfilePage. Route objects { path, element }; composed in app/routes.jsx.
import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import ProfilePage from './pages/ProfilePage.jsx'

// No JSX in this file, so the guard is built with createElement. Any logged-in user passes
// ('client' = lowest role); without a session RequireRole redirects to /login.
export const profileRoutes = [
  {
    path: '/perfil',
    element: createElement(RequireRole, { role: 'client' }, createElement(ProfilePage)),
  },
]
