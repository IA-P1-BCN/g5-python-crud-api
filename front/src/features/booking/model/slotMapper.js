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
