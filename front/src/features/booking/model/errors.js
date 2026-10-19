// Booking error codes (API_CONTRACT.md) -> Spanish messages. Used with mapApiError(error, bookingErrors).
import es from '@/i18n/es.js'

const t = es.booking.checkout.errors

export const bookingErrors = {
  SLOT_TAKEN: t.slotTaken,
  SLOT_NOT_AVAILABLE: t.slotTaken,
  INVALID_PLAYERS: t.invalidPlayers,
  ROOM_INACTIVE: t.roomInactive,
  USER_INACTIVE: t.userInactive,
  BOOKING_LIMIT_REACHED: t.bookingLimit,
  UNAUTHORIZED: t.unauthorized,
}
