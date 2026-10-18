// Route page: login with email and password (Supabase) or with Google.
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useLogin } from '../hooks/useLogin.js'
import { loginErrorMessage } from '../model/errors.js'
import { loginSchema } from '../model/loginSchema.js'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const passwordLogin = useLogin()
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Wait for the stored session, so a logged-in user never sees the form flash.
  if (loading) return <Spinner label={es.common.loading} />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  async function handleGoogle() {
    setGoogleSubmitting(true)
    setGoogleFailed(false)
    const { error } = await login()
    // On success the browser leaves for Google, so only the error case comes back here.
    if (error) {
      setGoogleFailed(true)
      setGoogleSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">{es.auth.title}</h1>
      <p>{es.auth.subtitle}</p>

      {/* noValidate: the browser would block the submit before our inline Zod messages show. */}
      <form
        noValidate
        onSubmit={handleSubmit((values) => passwordLogin.mutate(values))}
        className="flex w-full flex-col gap-4 text-left"
      >
        <Field
          label={es.auth.email}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          label={es.auth.password}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {passwordLogin.isError && (
          <Alert tone="error">{loginErrorMessage(passwordLogin.error)}</Alert>
        )}
        <Button type="submit" loading={passwordLogin.isPending}>
          {es.auth.submit}
        </Button>
      </form>

      <p>{es.auth.or}</p>
      <Button variant="secondary" onClick={handleGoogle} loading={googleSubmitting}>
        {es.auth.google}
      </Button>
      {googleFailed && <p role="alert">{es.auth.error}</p>}

      <p>
        {es.auth.noAccount}{' '}
        <Link to="/register" className="underline">
          {es.auth.registerLink}
        </Link>
      </p>
    </main>
  )
}
