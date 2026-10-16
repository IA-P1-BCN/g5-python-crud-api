import Button from '@/shared/ui/Button.jsx'
import { DUPLICATE_SLUG_ERROR } from '../model/errors'

export function RoomForm({ onSubmit, apiError }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())

    onSubmit({
      ...values,
      duration: values.duration ? Number(values.duration) : 0,
      base_price: values.base_price ? Number(values.base_price) : 0,
      capacity: values.capacity ? Number(values.capacity) : 0,
      min_players: values.min_players ? Number(values.min_players) : 0,
      difficulty: values.difficulty ? Number(values.difficulty) : 1,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
        {apiError === DUPLICATE_SLUG_ERROR && (
          <span className="text-error text-sm">Este slug ya existe</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="name">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="genre">
          Género
        </label>
        <input
          id="genre"
          name="genre"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm" htmlFor="duration">
            Duración (min)
          </label>
          <input
            id="duration"
            name="duration"
            type="number"
            className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm" htmlFor="base_price">
            Precio Base (€)
          </label>
          <input
            id="base_price"
            name="base_price"
            type="number"
            className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm" htmlFor="capacity">
            Capacidad
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm" htmlFor="min_players">
            Mín. Jugadores
          </label>
          <input
            id="min_players"
            name="min_players"
            type="number"
            className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="difficulty">
          Dificultad (1-5)
        </label>
        <input
          id="difficulty"
          name="difficulty"
          type="number"
          min="1"
          max="5"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="hook">
          Hook
        </label>
        <textarea
          id="hook"
          name="hook"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="story">
          Historia
        </label>
        <textarea
          id="story"
          name="story"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted text-sm" htmlFor="audience">
          Público
        </label>
        <input
          id="audience"
          name="audience"
          className="border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <Button type="submit" variant="primary">
        Guardar Sala
      </Button>
    </form>
  )
}

export default RoomForm
