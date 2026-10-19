import es from '@/i18n/es.js'
import Badge from '@/shared/ui/Badge.jsx'
import GameActions from './GameActions.jsx'

const STATUS_TONE = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'done',
  CANCELLED: 'cancelled',
}

const formatHour = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })

export default function TodayBookingsTable({ bookings, showDate = false }) {
  return (
    <table className="w-full text-left">
      <thead className="label-caps text-muted">
        <tr>
          {showDate && <th className="py-2">{es.staff.date}</th>}
          <th className="py-2">{es.staff.time}</th>
          <th className="py-2">{es.staff.room}</th>
          <th className="py-2">{es.staff.client}</th>
          <th className="py-2">{es.staff.players}</th>
          <th className="py-2">{es.staff.status}</th>
          <th className="py-2">{es.staff.actionsColumn}</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id} className="border-line border-t">
            {showDate && (
              <td className="py-3 font-mono">{formatDate(booking.time_slot.starts_at)}</td>
            )}
            <td className="py-3 font-mono">{formatHour(booking.time_slot.starts_at)}</td>
            <td className="py-3">{booking.room.name}</td>
            <td className="py-3">{booking.user.name}</td>
            <td className="py-3 font-mono">{booking.players}</td>
            <td className="py-3">
              <Badge tone={STATUS_TONE[booking.status]}>{es.staff.statuses[booking.status]}</Badge>
            </td>
            <td className="py-3">
              <GameActions booking={booking} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
