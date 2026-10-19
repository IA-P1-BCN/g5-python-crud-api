import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import es from '@/i18n/es.js'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { roomSchema } from '../model/roomSchema'

const t = es.adminRooms.form

const EMPTY = {
  slug: '',
  name: '',
  genre: '',
  duration: '60',
  base_price: '50',
  capacity: '4',
  min_players: '2',
  difficulty: '3',
  hook: '',
  story: '',
  audience: '',
}

function TextArea({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.name} className="text-muted text-sm">
        {label}
      </label>
      <textarea
        id={props.name}
        aria-invalid={error ? true : undefined}
        className={`border-line bg-surface-2 text-text min-h-11 rounded-md border px-3 py-2 ${error ? 'border-error' : ''}`}
        {...props}
      />
      {error && (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export function RoomForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(roomSchema), defaultValues: EMPTY })

  const submit = async (values) => {
    if (await onSubmit(values)) reset(EMPTY)
  }

  const num = (name, label) => (
    <Field label={label} type="number" error={errors[name]?.message} {...register(name)} />
  )

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Field label={t.slug} error={errors.slug?.message} {...register('slug')} />
      <Field label={t.name} error={errors.name?.message} {...register('name')} />
      <Field label={t.genre} error={errors.genre?.message} {...register('genre')} />
      <div className="grid grid-cols-2 gap-4">
        {num('duration', t.duration)}
        {num('base_price', t.basePrice)}
        {num('capacity', t.capacity)}
        {num('min_players', t.minPlayers)}
      </div>
      {num('difficulty', t.difficulty)}
      <TextArea label={t.hook} error={errors.hook?.message} {...register('hook')} />
      <TextArea label={t.story} error={errors.story?.message} {...register('story')} />
      <Field label={t.audience} error={errors.audience?.message} {...register('audience')} />
      <div>
        <Button type="submit" loading={isSubmitting}>
          {t.save}
        </Button>
      </div>
    </form>
  )
}

export default RoomForm
