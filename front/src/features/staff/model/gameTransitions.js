// Pure: which actions are allowed for a booking status (BR-G2).
// PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED
const ACTION_BY_STATUS = {
  PENDING: 'confirm',
  CONFIRMED: 'start',
  IN_PROGRESS: 'finish',
}

export function allowedActions(booking) {
  const action = ACTION_BY_STATUS[booking.status]
  if (action) return [action]

  // The result can be registered only once, so only while there is none yet (BR-G4).
  if (booking.status === 'COMPLETED' && !booking.result) return ['register_result']

  return []
}
