// TanStack mutation: change slot, then invalidate my bookings and slots.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBookingSlot } from '../api/myBookingsApi.js'

export function useChangeSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBookingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
