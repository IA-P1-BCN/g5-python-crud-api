import { useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'

export function useLogin() {
  const { loginWithPassword } = useAuth()
  return useMutation({ mutationFn: loginWithPassword })
}
