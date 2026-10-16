// TanStack Query hook: my bookings (all statuses, tabs filter them in the page). No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchMyBookings } from '../api/myBookingsApi.js'

export function useMyBookings() {
  return useQuery({ queryKey: ['bookings', 'me'], queryFn: fetchMyBookings })
}
