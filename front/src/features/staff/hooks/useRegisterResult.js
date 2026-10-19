import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerResult } from '../api/staffApi.js'

export function useRegisterResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, result }) => registerResult(id, result),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'today'] }),
  })
}
