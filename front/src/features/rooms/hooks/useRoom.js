import { useQuery } from '@tanstack/react-query'
import { fetchRoom } from '../api/roomsApi.js'
import { toRoom } from '../model/roomMapper.js'

const ONE_MINUTE = 60_000

export function useRoom(slug) {
  return useQuery({
    queryKey: ['room', slug],
    queryFn: () => fetchRoom(slug),
    select: toRoom,
    enabled: Boolean(slug),
    staleTime: ONE_MINUTE,
  })
}
