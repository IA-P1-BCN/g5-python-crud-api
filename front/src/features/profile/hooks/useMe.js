// TanStack Query hook: current user profile. No JSX.
import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '../api/userApi.js'

export const profileQueryKey = ['users', 'me']

export function useMe() {
  return useQuery({ queryKey: profileQueryKey, queryFn: fetchProfile })
}
