const ARRIVED_TURN = 0.985

export function getHoverEvent(state, pickedId, isPointerNear) {
  if (state.status !== 'idle' && state.status !== 'hover') return null
  if (pickedId !== null) {
    return state.doorId === pickedId ? null : { type: 'HOVER', doorId: pickedId }
  }
  return state.status === 'hover' && !isPointerNear() ? { type: 'LEAVE' } : null
}

export function getArrivalEvent(state, turn) {
  return state.status === 'selected' && turn > ARRIVED_TURN ? { type: 'ARRIVED' } : null
}
