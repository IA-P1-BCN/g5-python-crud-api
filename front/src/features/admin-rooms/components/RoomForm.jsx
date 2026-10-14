import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../shared/ui/Button.jsx";
import { roomSchema } from "../model/roomSchema";
import { DUPLICATE_SLUG_ERROR } from "../model/errors";

const inputClass = "border-line bg-surface-2 text-text min-h-11 w-full rounded-md border px-3";

export function RoomForm({ initialValues, onSubmit, apiError }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: initialValues || {
      slug: "",
      genre: "",
      capacity: 4,
      min_players: 2,
      difficulty: 3,
      hook: "",
      story: "",
      audience: ""
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-muted text-sm">Slug</label>
        <input id="slug" {...register("slug")} className={inputClass} />
        {errors.slug && <p role="alert" className="text-error text-sm">{errors.slug.message}</p>}
        {apiError === DUPLICATE_SLUG_ERROR && (
          <p role="alert" className="text-error text-sm">Este slug ya existe (DUPLICATE)</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="genre" className="text-muted text-sm">Género</label>
        <input id="genre" {...register("genre")} className={inputClass} />
        {errors.genre && <p role="alert" className="text-error text-sm">{errors.genre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className="text-muted text-sm">Capacidad</label>
          <input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} className={inputClass} />
          {errors.capacity && <p role="alert" className="text-error text-sm">{errors.capacity.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="min_players" className="text-muted text-sm">Mín. Jugadores</label>
          <input id="min_players" type="number" {...register("min_players", { valueAsNumber: true })} className={inputClass} />
          {errors.min_players && <p role="alert" className="text-error text-sm">{errors.min_players.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="difficulty" className="text-muted text-sm">Dificultad (1-5)</label>
        <input id="difficulty" type="number" {...register("difficulty", { valueAsNumber: true })} className={inputClass} />
        {errors.difficulty && <p role="alert" className="text-error text-sm">{errors.difficulty.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="hook" className="text-muted text-sm">Hook</label>
        <textarea id="hook" {...register("hook")} className={inputClass} />
        {errors.hook && <p role="alert" className="text-error text-sm">{errors.hook.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="story" className="text-muted text-sm">Historia</label>
        <textarea id="story" {...register("story")} className={inputClass} />
        {errors.story && <p role="alert" className="text-error text-sm">{errors.story.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="audience" className="text-muted text-sm">Público</label>
        <input id="audience" {...register("audience")} className={inputClass} />
        {errors.audience && <p role="alert" className="text-error text-sm">{errors.audience.message}</p>}
      </div>

      <Button type="submit">Guardar Sala</Button>
    </form>
  );
}

export default RoomForm;
