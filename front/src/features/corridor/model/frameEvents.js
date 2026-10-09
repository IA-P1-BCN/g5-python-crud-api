const ARRIVED_TURN = 0.985 // how close to facing the door counts as arrived

// Door-machine event the pointer causes this frame, or null. `isPointerNear()` is only asked
// when needed: a hovered door is kept while the pointer stays near it on screen (no flicker
// when the camera leans).
export function getHoverEvent(state, pickedId, isPointerNear) {
  if (state.status !== 'idle' && state.status !== 'hover') return null
  if (pickedId !== null) {
    return state.doorId === pickedId ? null : { type: 'HOVER', doorId: pickedId }
  }
  return state.status === 'hover' && !isPointerNear() ? { type: 'LEAVE' } : null
}

// The selected door is facing us: the machine moves to "entering" and the page takes over.
export function getArrivalEvent(state, turn) {
  return state.status === 'selected' && turn > ARRIVED_TURN ? { type: 'ARRIVED' } : null
}
