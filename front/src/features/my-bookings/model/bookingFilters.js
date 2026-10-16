// Pure: filter bookings by tab (all / upcoming / past / cancelled). Same rules as the API tabs
// in API_CONTRACT.md: upcoming = date_from today, past = date_to yesterday (UTC days).
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
