// TanStack Query hook: my bookings (all statuses, tabs filter them in the page). No JSX.
import { useQuery } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth'
import { fetchCurrentUser, fetchMyBookings } from '../api/myBookingsApi.js'

export function useMyBookings() {
  const me = useQuery({ queryKey: meQueryKey, queryFn: fetchCurrentUser })
  const userId = me.data?.id
  // Key starts with ['bookings', 'me'] so the mutations' invalidation still matches.
  const bookings = useQuery({
    queryKey: ['bookings', 'me', userId],
    queryFn: () => fetchMyBookings(userId),
    enabled: userId != null,
  })
  // Without the user id the bookings query never runs: report the user error instead of loading forever.
  return me.isError ? me : bookings
}
