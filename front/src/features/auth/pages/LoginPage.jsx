// Route page: login with Google.
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import es from '@/i18n/es.js'
import Button from '@/shared/ui/Button.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleLogin() {
    setSubmitting(true)
    setFailed(false)
    const { error } = await login()
    // On success the browser leaves for Google, so only the error case comes back here.
    if (error) {
      setFailed(true)
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">{es.auth.title}</h1>
      <p>{es.auth.subtitle}</p>
      <Button onClick={handleLogin} loading={submitting} disabled={loading}>
        {es.auth.google}
      </Button>
      {failed && <p role="alert">{es.auth.error}</p>}
    </main>
  )
}
