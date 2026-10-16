// TanStack Query hook: player score computed from the finished games. No JSX.
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
