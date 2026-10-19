// Mutation: create a booking for the logged-in user. No JSX.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth'
import { mapApiError } from '@/shared/api/errors.js'
import { createBooking, fetchCurrentUser } from '../api/bookingApi.js'
import { bookingErrors } from '../model/errors.js'

export function useCreateBooking() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ slotId, players }) => {
      // AuthProvider already cached the user: no extra GET /users/me on each submit.
      const me = await queryClient.ensureQueryData({
        queryKey: meQueryKey,
        queryFn: fetchCurrentUser,
      })
      return createBooking({ userId: me.id, slotId, players })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] })
    },
  })

  // Resolves { success, data } and never throws: the page only decides where to go.
  const submitBooking = (values) =>
    mutation.mutateAsync(values).then(
      (data) => ({ success: true, data }),
      () => ({ success: false }),
    )

  return {
    submitBooking,
    isSubmitting: mutation.isPending,
    error: mutation.error ? mapApiError(mutation.error, bookingErrors).message : null,
  }
}
