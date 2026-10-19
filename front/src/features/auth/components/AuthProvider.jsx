import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { setAuthTokenGetter, setUnauthorizedHandler } from '@/shared/api/client.js'
import { fetchMe, meQueryKey, signInWithPassword, signUpWithPassword } from '../api/authApi.js'
import { AuthContext } from '../hooks/useAuth.js'
import { supabase } from '../model/supabaseClient.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const signOutSafely = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {})
  }, [])

  useLayoutEffect(() => {
    const removeToken = setAuthTokenGetter(async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    })
    const removeUnauthorized = setUnauthorizedHandler(async () => {
      await signOutSafely()
      setSession(null)
      queryClient.clear()
      navigate('/login', { replace: true })
    })
    return () => {
      removeToken()
      removeUnauthorized()
    }
  }, [navigate, queryClient, signOutSafely])

  useEffect(() => {
    let active = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setInitializing(false)
      })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') queryClient.clear()
      setSession(nextSession)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  const {
    data: me,
    isError: roleLookupFailed,
    refetch: retryRole,
  } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: Boolean(session),
    retry: false,
  })

  const login = useCallback(
    () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` },
      }),
    [],
  )

  const loginWithPassword = useCallback(async ({ email, password }) => {
    const { data, error } = await signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session)
  }, [])

  const registerWithPassword = useCallback(async (values) => {
    const { data, error } = await signUpWithPassword(values)
    if (error) throw error
    if (data.user?.identities?.length === 0) {
      throw Object.assign(new Error('User already registered'), { code: 'user_already_exists' })
    }
    if (data.session) setSession(data.session)
    return { needsConfirmation: !data.session }
  }, [])

  const logout = useCallback(async () => {
    await signOutSafely()
    setSession(null)
    queryClient.clear()
  }, [queryClient, signOutSafely])

  const value = useMemo(
    () => ({
      user: session
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name ?? null,
          }
        : null,
      role: session ? (me?.role ?? null) : null,
      roleError: Boolean(session) && roleLookupFailed,
      retryRole,
      isAuthenticated: Boolean(session),
      loading: initializing,
      login,
      loginWithPassword,
      registerWithPassword,
      logout,
    }),
    [
      session,
      me,
      roleLookupFailed,
      retryRole,
      initializing,
      login,
      loginWithPassword,
      registerWithPassword,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
