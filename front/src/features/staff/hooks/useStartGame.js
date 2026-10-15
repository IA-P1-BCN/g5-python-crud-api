// TanStack mutation: start game, then invalidate today's bookings.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startGame } from '../api/staffApi.js'

export function useStartGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'today'] }),
  })
}
