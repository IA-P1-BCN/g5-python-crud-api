import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../api/userApi.js'
import { profileQueryKey } from './useMe.js'

const AUTH_ME_KEY = ['auth', 'me']

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey })
      queryClient.invalidateQueries({ queryKey: AUTH_ME_KEY })
    },
  })
}
