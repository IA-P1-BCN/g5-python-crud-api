import RoomsCorridor from '../components/RoomsCorridor.jsx'
import { useRooms } from '../hooks/useRooms.js'
import { useGateStore } from '../model/gate.store.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import es from '@/i18n/es.js'

export default function RoomsPage() {
  const { data: rooms, isPending, isError } = useRooms()
  const startGate = useGateStore((state) => state.start)

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
      <header className="mb-6">
        <h1 className="heading-title text-text">{es.rooms.welcome}</h1>
        <p className="text-muted">{es.rooms.tagline}</p>
      </header>
      <RoomsCorridor onEnter={startGate} />
    </main>
  )
}
