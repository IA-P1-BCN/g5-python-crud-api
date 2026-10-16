// Routes of the my-bookings feature: /mis-reservas -> MyBookingsPage, /historial -> GameHistoryPage. Route objects { path, Component }; composed in app/routes.jsx.
import GameHistoryPage from './pages/GameHistoryPage.jsx'
import MyBookingsPage from './pages/MyBookingsPage.jsx'

// TODO(078): wrap with <RequireRole role="client"> once the auth feature exists.
export const myBookingsRoutes = [
  { path: '/mis-reservas', Component: MyBookingsPage },
  { path: '/historial', Component: GameHistoryPage },
]
