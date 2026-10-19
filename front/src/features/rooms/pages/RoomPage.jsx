import { useNavigate, useParams } from 'react-router-dom'
import Atmosphere from '../components/Atmosphere.jsx'
import { useRoom } from '../hooks/useRoom.js'
import { useRooms } from '../hooks/useRooms.js'
import { Booker } from '@/features/booking'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Chip from '@/shared/ui/Chip.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { formatPrice } from '@/shared/lib/format.js'
import es from '@/i18n/es.js'

const isNotFound = (error) => error?.response?.status === 404

function Difficulty({ level }) {
  return (
    <div role="img" aria-label={es.rooms.difficulty(level)} className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`size-2.5 rounded-full ${n <= level ? 'bg-room' : 'bg-line'}`} />
      ))}
    </div>
  )
}

export default function RoomPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: room, isPending, error } = useRoom(slug)
  const { data: rooms = [] } = useRooms()

  if (isPending)
    return (
      <div className="p-6">
        <Spinner label={es.rooms.loading} />
      </div>
    )

  if (isNotFound(error) || (!error && (!room || !room.isActive)))
    return (
      <div className="p-6">
        <p role="alert">{es.rooms.notFound}</p>
      </div>
    )

  if (error)
    return (
      <div className="p-6">
        <Alert tone="error">{es.rooms.error}</Alert>
      </div>
    )

  return (
    <main data-room={room.slug} className="relative isolate mx-auto max-w-4xl space-y-6 p-6">
      <Atmosphere slug={room.slug} />

      {rooms.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-caps text-muted">{es.rooms.switchRoom}</span>
          {rooms.map((r) => (
            <Chip
              key={r.id}
              selected={r.slug === room.slug}
              onClick={() => navigate(`/salas/${r.slug}`)}
            >
              {r.name}
            </Chip>
          ))}
        </div>
      )}

      <section className="bg-room-dark border-line space-y-3 rounded-lg border p-6">
        {room.genre && <p className="label-caps text-room">{room.genre}</p>}
        <h1 className="heading-hero text-text">{room.name}</h1>
        {room.story && <p className="text-text">{room.story}</p>}
        <Difficulty level={room.difficulty} />
        <p className="text-muted font-mono">
          {es.rooms.facts(
            room.minPlayers,
            room.maxPlayers,
            room.durationMin,
            formatPrice(room.pricePerPlayer),
          )}
        </p>
      </section>

      <Booker room={room} />

      <Button variant="secondary" onClick={() => navigate('/salas')}>
        {es.rooms.backToCorridor}
      </Button>
    </main>
  )
}
