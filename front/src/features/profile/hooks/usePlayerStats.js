import { useQuery } from '@tanstack/react-query'
import { fetchPlayerHistory } from '../api/userApi.js'
import { computePlayerStats } from '../model/playerStats.js'

export function usePlayerStats() {
  return useQuery({
    queryKey: ['users', 'me', 'history'],
    queryFn: fetchPlayerHistory,
    select: computePlayerStats,
  })
}
