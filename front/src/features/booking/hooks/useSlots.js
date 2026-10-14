// TanStack Query hook: slots of a room/day. No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchSlotsForDate } from '../api/bookingApi'

export function useSlots(roomId, date) {
  return useQuery({
    queryKey: ['slots', roomId, date],
    queryFn: () => fetchSlotsForDate({ roomId, date }),
    enabled: Boolean(roomId && date),
  })
}
