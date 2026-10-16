import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/shared/ui/Button.jsx'
import { roomSchema } from '../model/roomSchema'
import { DUPLICATE_SLUG_ERROR } from '../model/errors'

const inputClass = 'border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3'

export function RoomForm({ initialValues, onSubmit, apiError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: initialValues || {
      slug: '',
      name: '',
      genre: '',
      duration: 60,
      base_price: 50,
      capacity: 4,
      min_players: 2,
      difficulty: 3,
      hook: '',
      story: '',
      audience: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-muted text-sm">
          Slug
        </label>
        <input id="slug" {...register('slug')} className={inputClass} />
        {errors.slug && (
          <p role="alert" className="text-error text-sm">
            {errors.slug.message}
          </p>
        )}
        {apiError === DUPLICATE_SLUG_ERROR && (
          <p role="alert" className="text-error text-sm">
            Este slug ya existe (DUPLICATE)
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-muted text-sm">
          Nombre
        </label>
        <input id="name" {...register('name')} className={inputClass} />
        {errors.name && (
          <p role="alert" className="text-error text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="genre" className="text-muted text-sm">
          Género
        </label>
        <input id="genre" {...register('genre')} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="duration" className="text-muted text-sm">
            Duración (min)
          </label>
          <input
            id="duration"
            type="number"
            {...register('duration', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.duration && (
            <p role="alert" className="text-error text-sm">
              {errors.duration.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="base_price" className="text-muted text-sm">
            Precio Base (€)
          </label>
          <input
            id="base_price"
            type="number"
            {...register('base_price', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.base_price && (
            <p role="alert" className="text-error text-sm">
              {errors.base_price.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className="text-muted text-sm">
            Capacidad
          </label>
          <input
            id="capacity"
            type="number"
            {...register('capacity', { valueAsNumber: true })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="min_players" className="text-muted text-sm">
            Mín. Jugadores
          </label>
          <input
            id="min_players"
            type="number"
            {...register('min_players', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.min_players && (
            <p role="alert" className="text-error text-sm">
              {errors.min_players.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="difficulty" className="text-muted text-sm">
          Dificultad (1-5)
        </label>
        <input
          id="difficulty"
          type="number"
          {...register('difficulty', { valueAsNumber: true })}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="hook" className="text-muted text-sm">
          Hook
        </label>
        <textarea id="hook" {...register('hook')} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="story" className="text-muted text-sm">
          Historia
        </label>
        <textarea id="story" {...register('story')} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="audience" className="text-muted text-sm">
          Público
        </label>
        <input id="audience" {...register('audience')} className={inputClass} />
      </div>

      <Button type="submit">Guardar Sala</Button>
    </form>
  )
}

export default RoomForm
