// Routes of the booking feature: /reservar/:slug -> BookingPage. Route objects { path, Component }; composed in app/routes.jsx.
import { BookingPage } from './pages/BookingPage.jsx'

export const bookingRoutes = [{ path: '/reservar/:slug', Component: BookingPage }]
