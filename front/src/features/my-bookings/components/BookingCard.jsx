// Presentational: one booking (status badge, room, date, players, price). Props only.
import es from '@/i18n/es.js'
import { formatPrice } from '@/shared/lib/format.js'
import Badge from '@/shared/ui/Badge.jsx'

const t = es.myBookings.card

// Booking status -> Badge tone (the five booking states of DESIGN.md).
const STATUS_TONE = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'done',
  CANCELLED: 'cancelled',
}

// Slots are stored in UTC (BR-X5): we show UTC so the text is the same on every computer.
const DATE_FORMAT = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }

export default function BookingCard({ booking }) {
  const start = new Date(booking.time_slot.starts_at)

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
    </article>
  )
}
