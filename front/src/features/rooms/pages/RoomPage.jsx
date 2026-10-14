import { useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom.js'
import Skeleton from '@/shared/ui/Skeleton'
import es from '@/i18n/es.js'

export default function RoomPage() {
  const { slug } = useParams()
  const { data: room, isPending, isError } = useRoom(slug)

  if (isPending)
    return (
      <div className="p-6" role="status" aria-label={es.rooms.loading}>
        <Skeleton className="h-64 w-full rounded-lg" />
        <span className="sr-only">{es.rooms.loading}</span>
      </div>
    )

  if (isError || !room || !room.isActive) {
    return (
      <div className="p-6">
        <p role="alert">{es.rooms.notFound}</p>
      </div>
    )
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="heading-hero font-display text-text mb-2">{room.title}</h1>
      {room.subtitle && (
        <p className="text-muted text-sm mb-4">{room.subtitle}</p>
      )}
      {room.description && (
        <p className="text-text mb-6">{room.description}</p>
      )}
      {room.posterUrl && (
        <img
          src={room.posterUrl}
          alt={room.title}
          className="rounded-md w-full h-64 object-cover"
        />
      )}
    </main>
  )
}
