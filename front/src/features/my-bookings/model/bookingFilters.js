export const TABS = ['upcoming', 'past', 'cancelled', 'all']

export function filterBookings(bookings, tab, now = new Date()) {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const isActive = (b) => b.status !== 'CANCELLED'
  const startsAt = (b) => Date.parse(b.time_slot.starts_at)

  switch (tab) {
    case 'upcoming':
      return bookings.filter((b) => isActive(b) && startsAt(b) >= todayStart)
    case 'past':
      return bookings.filter((b) => isActive(b) && startsAt(b) < todayStart)
    case 'cancelled':
      return bookings.filter((b) => !isActive(b))
    default:
      return bookings
  }
}
