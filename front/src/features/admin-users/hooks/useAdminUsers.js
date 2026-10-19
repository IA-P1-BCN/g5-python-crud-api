// TanStack Query hook: users list (paginated). No JSX.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchUsers } from '../api/adminUsersApi.js'

export const USERS_KEY = ['admin', 'users']

export function useAdminUsers({ page = 1, size = 20 } = {}) {
  return useQuery({
    queryKey: [...USERS_KEY, { page, size }],
    queryFn: () => fetchUsers({ page, size }),
    // Keeps the current table on screen while the next page loads.
    placeholderData: keepPreviousData,
  })
}
