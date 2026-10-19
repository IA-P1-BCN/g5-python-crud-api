// TanStack Query hook: bookings of today, or of `day` (YYYY-MM-DD). No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchTodayBookings } from '../api/staffApi.js'

export function useTodayBookings(day = '') {
  // Starts with ['bookings', 'today']: the status mutations invalidate every day at once.
  return useQuery({
    queryKey: ['bookings', 'today', day],
    queryFn: () => fetchTodayBookings(day),
  })
}
