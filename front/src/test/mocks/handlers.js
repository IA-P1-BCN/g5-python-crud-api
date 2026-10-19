import rooms from './handlers/rooms.js'
import booking from './handlers/booking.js'
import myBookings from './handlers/myBookings.js'
import staff from './handlers/staff.js'
import auth from './handlers/auth.js'
import profile from './handlers/profile.js'
import adminUsers from './handlers/adminUsers.js'
import { adminRoomsHandlers as adminRooms } from './handlers/adminRooms'

export const handlers = [
  ...rooms,
  ...booking,
  ...myBookings,
  ...staff,
  ...auth,
  ...profile,
  ...adminRooms,
  ...adminUsers,
]
