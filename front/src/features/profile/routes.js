import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import ProfilePage from './pages/ProfilePage.jsx'

export const profileRoutes = [
  {
    path: '/perfil',
    element: createElement(RequireRole, { role: 'client' }, createElement(ProfilePage)),
  },
]
