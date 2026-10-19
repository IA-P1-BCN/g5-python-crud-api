// Route page: create an account with name, email and password (Supabase sign-up).
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRegister } from '../hooks/useRegister.js'
import { registerErrorMessage } from '../model/errors.js'
import { registerSchema } from '../model/registerSchema.js'

const t = es.auth.register

export default function RegisterPage() {
  const { isAuthenticated, loading } = useAuth()
  const signUp = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // Wait for the stored session, so a logged-in user never sees the form flash.
  if (loading) return <Spinner label={es.common.loading} />
  if (isAuthenticated) return <Navigate to="/salas" replace />

  // Supabase asked to confirm the email first: there is no session yet.
  if (signUp.isSuccess && signUp.data?.needsConfirmation) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-6 p-8 text-center">
        <h1 className="heading-title">{t.title}</h1>
        <Alert tone="success">{t.checkEmail}</Alert>
        <Link to="/login" className="underline">
          {t.loginLink}
        </Link>
      </main>
    )
  }

  // The confirmation field only exists to validate the form: it is never sent.
  const onSubmit = ({ name, email, password }) => signUp.mutate({ name, email, password })

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 p-8 text-center">
      <h1 className="heading-title">{t.title}</h1>
      <p>{t.subtitle}</p>

      {/* noValidate: the browser would block the submit before our inline Zod messages show. */}
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4 text-left"
      >
        <Field
          label={t.name}
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Field
          label={t.confirmPassword}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {signUp.isError && <Alert tone="error">{registerErrorMessage(signUp.error)}</Alert>}
        <Button type="submit" loading={signUp.isPending}>
          {t.submit}
        </Button>
      </form>

      <p>
        {t.haveAccount}{' '}
        <Link to="/login" className="underline">
          {t.loginLink}
        </Link>
      </p>
    </main>
  )
}
