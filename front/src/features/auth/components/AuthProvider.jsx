// Context: logged-in user and role. Plugs the Supabase JWT into the Axios client and handles 401.
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

  // The local session is dropped even if Supabase cannot be reached.
  const signOutSafely = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // nothing to do: the caller clears the local state anyway
    }
  }, [])

  // Layout effect: runs before the children's effects, so their first request already has the token.
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
      .catch(() => {
        // no readable session: treat the visitor as logged out
      })
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

  // Email + password. Supabase persists the session; we also keep it in state right away so the
  // caller sees isAuthenticated without waiting for the auth-state event. Throws the Supabase error.
  const loginWithPassword = useCallback(async ({ email, password }) => {
    const { data, error } = await signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session)
  }, [])

  // Sign-up with email + password. With "confirm email" off Supabase returns a session and the user is
  // in at once; with it on there is no session yet. Resolves { needsConfirmation }, throws the error.
  const registerWithPassword = useCallback(async (values) => {
    const { data, error } = await signUpWithPassword(values)
    if (error) throw error
    // An already registered email: Supabase hides it (no error) and returns a user without identities.
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
      // Logged in but /users/me failed: the role stays null, so consumers need this to tell it
      // apart from "still loading" and to offer a retry.
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
