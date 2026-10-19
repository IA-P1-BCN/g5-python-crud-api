// Email + password login as a mutation (pending / error state for the form).
// On success AuthProvider holds the session, and LoginPage redirects to /salas.
import { useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'

export function useLogin() {
  const { loginWithPassword } = useAuth()
  return useMutation({ mutationFn: loginWithPassword })
}
