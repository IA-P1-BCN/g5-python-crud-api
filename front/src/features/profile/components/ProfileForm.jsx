// Profile form: name and phone editable, email read-only. React Hook Form + Zod.
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { useUpdateMe } from '../hooks/useUpdateMe.js'
import { profileSchema } from '../model/profileSchema.js'

const t = es.profile

export default function ProfileForm({ profile }) {
  const { mutate, isPending, isSuccess, isError, error } = useUpdateMe()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, phone: profile.phone ?? '' },
  })

  return (
    // noValidate: the Zod messages are shown, not the browser's own bubble.
    <form noValidate onSubmit={handleSubmit((values) => mutate(values))} className="space-y-4">
      <Field
        label={t.name}
        error={errors.name?.message}
        autoComplete="name"
        {...register('name')}
      />
      <Field
        label={t.phone}
        type="tel"
        error={errors.phone?.message}
        autoComplete="tel"
        {...register('phone')}
      />
      {/* Not registered: the email is never sent (the API rejects unknown fields). */}
      <Field label={t.email} defaultValue={profile.email} disabled />
      {isSuccess && <Alert tone="success">{t.saved}</Alert>}
      {isError && <Alert tone="error">{mapApiError(error).message}</Alert>}
      <Button type="submit" loading={isPending}>
        {t.save}
      </Button>
    </form>
  )
}
