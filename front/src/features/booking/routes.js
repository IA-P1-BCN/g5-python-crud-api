import { BookingPage } from './pages/BookingPage.jsx'
import { CheckoutPage } from './pages/CheckoutPage.jsx'
import { ConfirmationPage } from './pages/ConfirmationPage.jsx'

export const bookingRoutes = [
  { path: '/reservar/:slug', Component: BookingPage },
  { path: '/booking/checkout', Component: CheckoutPage },
  { path: '/booking/confirmation', Component: ConfirmationPage },
]
