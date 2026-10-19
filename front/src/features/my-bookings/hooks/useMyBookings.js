import { useQuery } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth'
import { fetchCurrentUser, fetchMyBookings } from '../api/myBookingsApi.js'

export function useMyBookings() {
  const me = useQuery({ queryKey: meQueryKey, queryFn: fetchCurrentUser })
  const userId = me.data?.id
  const bookings = useQuery({
    queryKey: ['bookings', 'me', userId],
    queryFn: () => fetchMyBookings(userId),
    enabled: userId != null,
  })
  return me.isError ? me : bookings
}
