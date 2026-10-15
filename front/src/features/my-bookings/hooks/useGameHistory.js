// TanStack Query hook: game history. No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchGameHistory } from '../api/myBookingsApi.js'

export function useGameHistory() {
  return useQuery({ queryKey: ['users', 'me', 'history'], queryFn: fetchGameHistory })
}
