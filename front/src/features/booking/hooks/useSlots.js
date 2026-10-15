// TanStack Query hook: slots of a room/day. No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchSlots } from '../api/bookingApi.js'
import { toSlot } from '../model/slotMapper.js'

export function useSlots(roomId, date) {
  return useQuery({
    queryKey: ['slots', roomId, date],
    queryFn: () => fetchSlots({ roomId, date }),
    select: (items) => items.map(toSlot),
    enabled: Boolean(roomId && date),
  })
}
