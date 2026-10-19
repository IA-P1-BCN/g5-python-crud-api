import { useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'

export function useRegister() {
  const { registerWithPassword } = useAuth()
  return useMutation({ mutationFn: registerWithPassword })
}
