import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeUserRole, deactivateUser } from '../api/adminUsersApi.js'
import { USERS_KEY } from './useAdminUsers.js'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (change) =>
      change.type === 'role' ? changeUserRole(change.id, change.role) : deactivateUser(change.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
