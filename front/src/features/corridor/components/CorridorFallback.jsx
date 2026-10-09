// Poster grid shown without WebGL / small screen / reduced motion. Accessible path.
import es from '@/i18n/es.js'
import Button from '@/shared/ui/Button.jsx'

export default function CorridorFallback({ rooms, onEnter }) {
  return (
    <ul aria-label={es.rooms.corridorLabel} className="grid gap-4 sm:grid-cols-2">
      {rooms.map((room) => (
        <li
          key={room.id}
          data-room={room.slug}
          className="border-room bg-room-dark flex flex-col gap-3 rounded-xl border p-5 text-white"
        >
          <span className="text-room text-sm">{room.genre}</span>
          <h2 className="text-xl font-semibold">{room.name}</h2>
          <Button onClick={() => onEnter(room)}>{es.rooms.enter(room.name)}</Button>
        </li>
      ))}
    </ul>
  )
}
