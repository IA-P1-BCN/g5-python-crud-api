import { Link } from 'react-router-dom'
import es from '@/i18n/es.js'
import Badge from '@/shared/ui/Badge.jsx'
import Button from '@/shared/ui/Button.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'

const t = es.adminRooms

export function RoomsTable({ rooms, onToggleActive }) {
  if (!rooms || rooms.length === 0) return <EmptyState title={t.empty} />

  return (
    <table className="border-line w-full border-t text-left text-sm">
      <thead className="text-muted text-xs uppercase">
        <tr>
          <th className="px-4 py-3 font-medium">{t.table.name}</th>
          <th className="px-4 py-3 font-medium">{t.table.genre}</th>
          <th className="px-4 py-3 font-medium">{t.table.status}</th>
          <th className="px-4 py-3 text-right font-medium">{t.table.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => (
          <tr key={room.id} className="border-line border-t">
            <td className="px-4 py-3">{room.name}</td>
            <td className="px-4 py-3">{room.genre}</td>
            <td className="px-4 py-3">
              <Badge tone={room.is_active ? 'confirmed' : 'cancelled'}>
                {room.is_active ? t.active : t.inactive}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Link className="text-room mr-4 underline" to={`/admin/salas/${room.id}/horarios`}>
                {t.manageSlots}
              </Link>
              <Button variant="ghost" onClick={() => onToggleActive(room.id, !room.is_active)}>
                {room.is_active ? t.deactivate : t.activate}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default RoomsTable
