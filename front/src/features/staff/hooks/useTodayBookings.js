import { useQuery } from '@tanstack/react-query'
import { fetchBookingsView } from '../api/staffApi.js'

export function useTodayBookings(view = 'today') {
  return useQuery({
    queryKey: ['bookings', 'today', view],
    queryFn: () => fetchBookingsView(view),
  })
}
