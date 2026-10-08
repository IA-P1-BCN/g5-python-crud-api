// Composes the per-feature MSW handlers in test/mocks/handlers/. Do not add handlers here.
import rooms from './handlers/rooms.js'
import booking from './handlers/booking.js'
import myBookings from './handlers/myBookings.js'
import staff from './handlers/staff.js'
import auth from './handlers/auth.js'
import profile from './handlers/profile.js'
import adminRooms from './handlers/adminRooms.js'
import adminUsers from './handlers/adminUsers.js'
import adminStats from './handlers/adminStats.js'

export const handlers = [
  ...rooms,
  ...booking,
  ...myBookings,
  ...staff,
  ...auth,
  ...profile,
  ...adminRooms,
  ...adminUsers,
  ...adminStats,
]
