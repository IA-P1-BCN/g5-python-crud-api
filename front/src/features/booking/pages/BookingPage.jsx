// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useParams } from 'react-router-dom'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { Booker } from '../components/Booker.jsx'

export function BookingPage() {
  const { slug } = useParams()
  const { data: room, isLoading: roomLoading, error: roomError } = useRoom(slug)
  if (roomLoading)
    return (
      <main className="p-6">
        <Spinner label={es.booking.loadingSlots} />
      </main>
    )

  if (roomError?.response?.status === 404 || (room && !room.isActive))
    return (
      <main className="p-6">
        <EmptyState title={es.booking.roomNotFound} />
      </main>
    )

  if (roomError)
    return (
      <main className="p-6">
        <Alert tone="error">{es.booking.errors.loadRoomFailed}</Alert>
      </main>
    )

  return (
    <main data-room={slug} className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="heading-title">{es.booking.title}</h1>

      <Booker room={room} />
    </main>
  )
}
