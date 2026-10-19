// TanStack mutation: deactivate or change role, then invalidate users.
// Usage: mutate({ type: 'deactivate', id }) or mutate({ type: 'role', id, role }).
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeUserRole, deactivateUser } from '../api/adminUsersApi.js'
import { USERS_KEY } from './useAdminUsers.js'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (change) =>
      change.type === 'role' ? changeUserRole(change.id, change.role) : deactivateUser(change.id),
    // Also on error: the table must show what the API really has (e.g. after a 404 or LAST_ADMIN).
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
