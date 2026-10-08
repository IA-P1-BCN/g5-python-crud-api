import { useRoutes } from 'react-router-dom'
import { adminRoomsRoutes } from '@/features/admin-rooms'
import { adminStatsRoutes } from '@/features/admin-stats'
import { adminUsersRoutes } from '@/features/admin-users'
import { authRoutes } from '@/features/auth'
import { bookingRoutes } from '@/features/booking'
import { myBookingsRoutes } from '@/features/my-bookings'
import { profileRoutes } from '@/features/profile'
import { roomsRoutes } from '@/features/rooms'
import { staffRoutes } from '@/features/staff'

// Only composes the routes owned by each feature. Add routes in features/<name>/routes.js, not here.
export default function AppRoutes() {
  return useRoutes([
    { path: '/', element: <h1>Escape rooms</h1> },
    ...roomsRoutes,
    ...bookingRoutes,
    ...myBookingsRoutes,
    ...authRoutes,
    ...profileRoutes,
    ...staffRoutes,
    ...adminRoomsRoutes,
    ...adminUsersRoutes,
    ...adminStatsRoutes,
  ])
}
