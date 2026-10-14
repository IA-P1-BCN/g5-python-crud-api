// Maps the room DTO from the API to the view model, so the UI never depends on backend field names.
export function toRoom(dto) {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    genre: dto.genre,
    minPlayers: dto.min_players,
    maxPlayers: dto.capacity,
    durationMin: dto.duration,
    pricePerPlayer: Number(dto.base_price),
    difficulty: dto.difficulty,
    hook: dto.hook,
    story: dto.story,
    audience: dto.audience,
    isActive: dto.status === 'active',
    hasUpcomingSlots: dto.has_upcoming_slots === true,
  }
}
