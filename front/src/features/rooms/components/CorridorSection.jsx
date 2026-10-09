import { useMemo } from 'react'
import { CorridorView } from '@/features/corridor'
import es from '@/i18n/es.js'
import Skeleton from '@/shared/ui/Skeleton.jsx'
import { useRooms } from '../hooks/useRooms.js'
import { getRoomTheme } from '../model/roomThemes.js'

export default function CorridorSection({ onEnter }) {
  const { data, isPending, isError } = useRooms()

  // Stable reference: the 3D scene is rebuilt whenever this array changes.
  const rooms = useMemo(
    () => data?.map((room) => ({ ...room, accent: getRoomTheme(room.slug).accent })),
    [data],
  )

  if (isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p>{es.rooms.loading}</p>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (isError) return <p role="alert">{es.rooms.loadError}</p>
  if (rooms.length === 0) return <p>{es.rooms.empty}</p>

  return <CorridorView rooms={rooms} onEnter={onEnter} />
}
