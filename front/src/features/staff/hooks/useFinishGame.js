import { useMutation, useQueryClient } from '@tanstack/react-query'
import { finishGame } from '../api/staffApi.js'

export function useFinishGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: finishGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'today'] }),
  })
}
