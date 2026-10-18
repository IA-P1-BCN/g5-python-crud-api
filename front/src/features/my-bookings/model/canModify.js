// Pure: 24h rule (BR-B6/B7). UX only: the API stays the authority (TOO_LATE_TO_* errors).
export const EDITABLE_STATUSES = ['PENDING', 'CONFIRMED']
const MIN_NOTICE_MS = 24 * 60 * 60 * 1000

export function isAtLeast24hAway(startsAt, now = new Date()) {
  return new Date(startsAt) - now >= MIN_NOTICE_MS
}

export function canModify(booking, now = new Date()) {
  if (!EDITABLE_STATUSES.includes(booking.status)) return false
  return isAtLeast24hAway(booking.time_slot.starts_at, now)
}
