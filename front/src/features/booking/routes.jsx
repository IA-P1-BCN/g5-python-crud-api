// Routes of the booking feature: /reservar/:slug -> BookingPage, checkout -> CheckoutPage, confirmation -> ConfirmationPage. Route objects { path, Component }; composed in app/routes.jsx.
import { BookingPage } from './pages/BookingPage'

export const bookingRoutes = [
  {
    path: '/reservar/:slug',
    element: <BookingPage />,
  },
]
