import RoomPoster from '../components/RoomPoster.jsx'
import { useRooms } from '../hooks/useRooms.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import es from '@/i18n/es.js'

export default function RoomsPage() {
  const { data: rooms, isPending, isError } = useRooms()

  if (isPending)
    return (
      <div className="p-6">
        <Spinner label={es.rooms.loading} />
      </div>
    )

  if (isError)
    return (
      <div className="p-6">
        <Alert tone="error">{es.rooms.error}</Alert>
      </div>
    )

  if (rooms.length === 0)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <EmptyState title={es.rooms.empty} />
      </main>
    )

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="heading-hero text-text mb-6">{es.rooms.corridorLabel}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomPoster key={room.id} room={room} />
        ))}
      </div>
    </main>
  )
}
