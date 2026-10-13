export const getVisibleRooms = (rooms) => rooms.filter((r) => r.isActive && r.hasUpcomingSlots)
