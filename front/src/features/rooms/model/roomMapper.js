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

export function mapRoom(rawRoom) {
  return {
    id: rawRoom.id,
    slug: rawRoom.slug,
    title: rawRoom.title ?? rawRoom.name,
    subtitle: rawRoom.subtitle ?? rawRoom.genre,
    description: rawRoom.description ?? rawRoom.hook ?? rawRoom.story,
    posterUrl: rawRoom.poster_url ?? rawRoom.posterUrl ?? null,
    isActive: rawRoom.is_active ?? rawRoom.status === 'active',
    hasUpcomingSlots:
      rawRoom.has_upcoming_slots ?? rawRoom.hasUpcomingSlots ?? false,
    isFull: rawRoom.is_full ?? rawRoom.isFull ?? false,
  }
}

export function mapRoomsList(rawRooms) {
  if (!Array.isArray(rawRooms)) return []
  return rawRooms.map(mapRoom).filter((room) => room.isActive)
}
