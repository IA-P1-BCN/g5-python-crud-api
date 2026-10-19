import es from '@/i18n/es.js'
import { formatPrice } from '@/shared/lib/format.js'
import Badge from '@/shared/ui/Badge.jsx'
import Button from '@/shared/ui/Button.jsx'
import { canModify, EDITABLE_STATUSES } from '../model/canModify.js'

const t = es.myBookings.card

const STATUS_TONE = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'done',
  CANCELLED: 'cancelled',
}

const DATE_FORMAT = { day: 'numeric', month: 'long', year: 'numeric' }
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit' }

export default function BookingCard({ booking, onModify, onChangeSlot, onCancel }) {
  const start = new Date(booking.time_slot.starts_at)
  const showActions = EDITABLE_STATUSES.includes(booking.status)
  const allowed = canModify(booking)

  return (
    <article className="bg-surface border-line flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="heading-title">{booking.room.name}</h2>
        <Badge tone={STATUS_TONE[booking.status]}>{t.status[booking.status]}</Badge>
      </div>
      <p className="text-muted">
        {start.toLocaleDateString('es-ES', DATE_FORMAT)} ·{' '}
        {start.toLocaleTimeString('es-ES', TIME_FORMAT)}
      </p>
      <dl className="flex gap-6">
        <div>
          <dt className="label-caps text-muted">{t.players}</dt>
          <dd className="font-mono">{booking.players}</dd>
        </div>
        <div>
          <dt className="label-caps text-muted">{t.total}</dt>
          <dd className="text-exit font-mono">{formatPrice(booking.total_price)}</dd>
        </div>
      </dl>
      {showActions && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={!allowed} onClick={() => onModify(booking)}>
              {es.myBookings.actions.modify}
            </Button>
            <Button variant="secondary" disabled={!allowed} onClick={() => onChangeSlot(booking)}>
              {es.myBookings.actions.changeSlot}
            </Button>
            <Button variant="ghost" disabled={!allowed} onClick={() => onCancel(booking)}>
              {es.myBookings.actions.cancel}
            </Button>
          </div>
          {!allowed && <p className="text-muted text-sm">{es.myBookings.actions.tooLate}</p>}
        </div>
      )}
    </article>
  )
}
