const ACTION_BY_STATUS = {
  PENDING: 'confirm',
  CONFIRMED: 'start',
  IN_PROGRESS: 'finish',
}

export function allowedActions(booking) {
  const action = ACTION_BY_STATUS[booking.status]
  if (action) return [action]

  if (booking.status === 'COMPLETED' && !booking.result) return ['register_result']

  return []
}
