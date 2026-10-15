import Badge from '@/shared/ui/Badge.jsx'
import Button from '@/shared/ui/Button.jsx'

export function RoomsTable({ rooms, onToggleActive }) {
  if (!rooms || rooms.length === 0) {
    return <p className="text-muted text-sm">Todavía no hay salas creadas.</p>
  }

  return (
    <table className="border-line w-full border-t text-left text-sm">
      <thead className="text-muted text-xs uppercase">
        <tr>
          <th className="px-4 py-3 font-medium">Slug</th>
          <th className="px-4 py-3 font-medium">Género</th>
          <th className="px-4 py-3 font-medium">Estado</th>
          <th className="px-4 py-3 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => (
          <tr key={room.id} className="border-line border-t">
            <td className="px-4 py-3">{room.slug}</td>
            <td className="px-4 py-3">{room.genre}</td>
            <td className="px-4 py-3">
              <Badge tone={room.is_active ? 'confirmed' : 'cancelled'}>
                {room.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Button
                variant="ghost"
                onClick={() => onToggleActive(room.id, !room.is_active)}
              >
                {room.is_active ? 'Desactivar' : 'Activar'}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default RoomsTable