// TanStack Query hook: the planning list for a view ('today', 'ALL' or a status). No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchBookingsView } from '../api/staffApi.js'

export function useTodayBookings(view = 'today') {
  // Starts with ['bookings', 'today']: the status mutations invalidate every view at once.
  return useQuery({
    queryKey: ['bookings', 'today', view],
    queryFn: () => fetchBookingsView(view),
  })
}
