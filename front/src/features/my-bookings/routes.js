import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import GameHistoryPage from './pages/GameHistoryPage.jsx'
import MyBookingsPage from './pages/MyBookingsPage.jsx'

export const myBookingsRoutes = [
  {
    path: '/mis-reservas',
    element: createElement(RequireRole, { role: 'client' }, createElement(MyBookingsPage)),
  },
  {
    path: '/historial',
    element: createElement(RequireRole, { role: 'client' }, createElement(GameHistoryPage)),
  },
]
