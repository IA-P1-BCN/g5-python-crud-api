import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmBooking } from '../api/staffApi.js'

export function useConfirmBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'today'] }),
  })
}
