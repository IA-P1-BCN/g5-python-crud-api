import { Link } from 'react-router-dom'
import es from '@/i18n/es.js'

export default function RoomPoster({ room }) {
  const isDimmed = !room.hasUpcomingSlots || room.isFull

  return (
    <article className={`bg-surface border border-line rounded-lg p-4 flex flex-col justify-between ${isDimmed ? 'dimmed' : ''}`}>
      <div>
        {room.posterUrl && (
          <img src={room.posterUrl} alt={room.title} className="rounded-md w-full h-48 object-cover mb-3" />
        )}
        <h3 className="font-display heading-title text-text mb-1">{room.title}</h3>
        <p className="text-muted text-sm mb-4">{room.subtitle}</p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        {room.isFull && (
          <span className="text-xs uppercase tracking-wider text-muted font-mono">{es.rooms.fullNotice}</span>
        )}
        <Link 
          to={`/salas/${room.slug}`} 
          className="bg-exit text-on-exit px-4 py-2 rounded-md font-sans text-sm shadow-glow ml-auto"
        >
          {es.rooms.viewDetails}
        </Link>
      </div>
    </article>
  )
}
