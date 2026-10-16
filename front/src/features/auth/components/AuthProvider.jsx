// Context: logged-in user and role. Plugs the Supabase JWT into the Axios client and handles 401.
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { setAuthTokenGetter, setUnauthorizedHandler } from '@/shared/api/client.js'
import { fetchMe, meQueryKey } from '../api/authApi.js'
import { AuthContext } from '../hooks/useAuth.js'
import { supabase } from '../model/supabaseClient.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Layout effect: runs before the children's effects, so their first request already has the token.
  useLayoutEffect(() => {
    const removeToken = setAuthTokenGetter(async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    })
    const removeUnauthorized = setUnauthorizedHandler(async () => {
      await supabase.auth.signOut()
      setSession(null)
      queryClient.removeQueries({ queryKey: meQueryKey })
      navigate('/login', { replace: true })
    })
    return () => {
      removeToken()
      removeUnauthorized()
    }
  }, [navigate, queryClient])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setInitializing(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const { data: me } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: Boolean(session),
    retry: false,
  })

  const login = useCallback(
    () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      }),
    [],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    queryClient.removeQueries({ queryKey: meQueryKey })
  }, [queryClient])

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
      isAuthenticated: Boolean(session),
      loading: initializing,
      login,
      logout,
    }),
    [session, me, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
