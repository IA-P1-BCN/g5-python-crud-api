// Presentational: room poster card. Props only, no data fetching.
import { useNavigate } from 'react-router-dom'
import Button from '@/shared/ui/Button.jsx'
import es from '@/i18n/es.js'

export default function RoomPoster({ room }) {
  const navigate = useNavigate()

  return (
    <article className="bg-surface border-line flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h3 className="heading-title text-text">{room.name}</h3>
        <p className="text-muted">{room.genre}</p>
      </div>
      <Button className="self-end" onClick={() => navigate(`/salas/${room.slug}`)}>
        {es.rooms.viewDetails}
      </Button>
    </article>
  )
}
