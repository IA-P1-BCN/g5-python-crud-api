import { useQuery } from '@tanstack/react-query'
import { fetchActiveRooms } from '../api/roomsApi.js'
import { mapRoomsList } from '../model/roomMapper.js'

const ONE_MINUTE = 60_000

export function useRoomsList() {
  return useQuery({
    queryKey: ['rooms', 'list'],
    queryFn: fetchActiveRooms,
    select: mapRoomsList,
    staleTime: ONE_MINUTE,
  })
}
