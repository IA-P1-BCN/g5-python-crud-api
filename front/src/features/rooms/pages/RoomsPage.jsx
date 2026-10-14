import RoomPoster from '../components/RoomPoster'
import { useRoomsList } from '../hooks/useRoomsList.js'
import Skeleton from '@/shared/ui/Skeleton'
import Alert from '@/shared/ui/Alert'
import es from '@/i18n/es.js'

export default function RoomsPage() {
  const { data: rooms, isPending, isError } = useRoomsList()

  if (isPending)
    return (
      <div className="p-6" role="status" aria-label={es.rooms.loading}>
        <Skeleton className="h-64 w-full rounded-lg" />
        <span className="sr-only">{es.rooms.loading}</span>
      </div>
    )
  if (isError)
    return (
      <div className="p-6">
        <Alert tone="error">{es.rooms.error}</Alert>
      </div>
    )

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="heading-hero font-display text-text mb-6">
        {es.rooms.corridorLabel}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room) => (
          <RoomPoster key={room.id} room={room} />
        ))}
      </div>
    </main>
  )
}
