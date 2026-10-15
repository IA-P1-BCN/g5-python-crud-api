// TanStack Query hook: today's bookings. No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchTodayBookings } from '../api/staffApi.js'

export function useTodayBookings() {
  return useQuery({ queryKey: ['bookings', 'today'], queryFn: fetchTodayBookings })
}
