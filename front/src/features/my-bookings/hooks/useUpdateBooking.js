import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBookingPlayers } from '../api/myBookingsApi.js'

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBookingPlayers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] }),
  })
}
