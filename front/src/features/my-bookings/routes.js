// Routes of the my-bookings feature: /mis-reservas -> MyBookingsPage, /historial -> GameHistoryPage. Route objects { path, Component }; composed in app/routes.jsx.
import GameHistoryPage from './pages/GameHistoryPage.jsx'

// TODO(078): wrap with <RequireRole role="client"> once the auth feature exists.
export const myBookingsRoutes = [{ path: '/historial', Component: GameHistoryPage }]
