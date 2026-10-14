import es from '@/i18n/es.js'
import { useRooms } from '../hooks/useRooms.js'

export default function FakeBanner() {
  const { data: rooms = [] } = useRooms()
  return (
    <div className="bg-surface-2">
      <h2 className="heading-title">{es.rooms.corridorLabel}</h2>
      {rooms.map((r) => (
        <p key={r.id}>{r.name}</p>
      ))}
    </div>
  )
}
