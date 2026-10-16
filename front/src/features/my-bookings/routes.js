// Routes of the my-bookings feature: /mis-reservas -> MyBookingsPage, /historial -> GameHistoryPage. Route objects { path, Component | element }; composed in app/routes.jsx.
import { createElement } from 'react'
import { RequireRole } from '@/features/auth'
import GameHistoryPage from './pages/GameHistoryPage.jsx'

// This file has no JSX, so the guard is built with createElement.
export const myBookingsRoutes = [
  {
    path: '/historial',
    element: createElement(RequireRole, { role: 'client' }, createElement(GameHistoryPage)),
  },
]
