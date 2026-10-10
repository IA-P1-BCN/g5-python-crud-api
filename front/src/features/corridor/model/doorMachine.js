export const initialState = { status: 'idle', doorId: null }

export function transition(state, event) {
  switch (state.status) {
    case 'idle':
    case 'hover':
      switch (event.type) {
        case 'HOVER':
          return { status: 'hover', doorId: event.doorId }
        case 'LEAVE':
          return state.status === 'hover' ? initialState : state
        case 'SELECT':
          return { status: 'selected', doorId: event.doorId }
        default:
          return state
      }
    case 'selected':
      return event.type === 'ARRIVED' ? { status: 'entering', doorId: state.doorId } : state
    case 'entering':
      return event.type === 'RESET' ? initialState : state
    default:
      return state
  }
}
