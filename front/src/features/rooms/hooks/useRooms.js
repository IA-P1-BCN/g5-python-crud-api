import { useQuery } from '@tanstack/react-query'
import { fetchActiveRooms } from '../api/roomsApi.js'
import { toRoom } from '../model/roomMapper.js'
import { getVisibleRooms } from '../model/visibleRooms.js'

const ONE_MINUTE = 60_000

const selectVisibleRooms = (dtos) => getVisibleRooms(dtos.map(toRoom))

export function useRooms() {
  return useQuery({
    queryKey: ['rooms', 'active'],
    queryFn: fetchActiveRooms,
    select: selectVisibleRooms,
    staleTime: ONE_MINUTE,
  })
}
