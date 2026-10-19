// Reads the AuthProvider context: user, role, login, logout.
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

// Id of the logged-in user (Supabase id), or null. Handy to scope query keys per user.
export function useCurrentUserId() {
  return useAuth().user?.id ?? null
}
