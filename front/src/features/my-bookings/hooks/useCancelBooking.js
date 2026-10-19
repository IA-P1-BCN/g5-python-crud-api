import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelBooking } from '../api/myBookingsApi.js'

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] }),
  })
}
