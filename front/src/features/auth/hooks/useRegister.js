// Sign-up (name, email, password) as a mutation: pending / error state for the form.
// Resolves with { needsConfirmation }. When Supabase returns a session, AuthProvider already holds
// it and RegisterPage redirects to /salas.
import { useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'

export function useRegister() {
  const { registerWithPassword } = useAuth()
  return useMutation({ mutationFn: registerWithPassword })
}
