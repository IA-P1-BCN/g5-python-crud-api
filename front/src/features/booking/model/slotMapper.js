// Maps a time slot DTO (GET /time-slots) to the view model of the slot grid.
// `state` (free / taken / blocked / past) is computed by the API
export function toSlot(dto) {
  return {
    id: dto.id,
    startsAt: dto.starts_at,
    time: new Date(dto.starts_at).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    state: dto.state,
  }
}
