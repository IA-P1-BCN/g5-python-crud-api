import { useNavigate, useParams } from 'react-router-dom'
import Atmosphere from '../components/Atmosphere.jsx'
import { useRoom } from '../hooks/useRoom.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import es from '@/i18n/es.js'

const isNotFound = (error) => error?.response?.status === 404

export default function RoomPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: room, isPending, error } = useRoom(slug)

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
    <main className="relative isolate mx-auto max-w-3xl p-6">
      <Atmosphere slug={room.slug} />
      <h1 className="heading-hero text-text mb-2">{room.name}</h1>
      {room.genre && <p className="text-muted mb-4">{room.genre}</p>}
      {room.hook && <p className="text-text mb-4">{room.hook}</p>}
      {room.story && <p className="text-text mb-6">{room.story}</p>}
      {room.audience && <p className="text-muted mb-6">{room.audience}</p>}
      <Button variant="secondary" onClick={() => navigate('/salas')}>
        {es.rooms.backToCorridor}
      </Button>
    </main>
  )
}
