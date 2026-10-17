import es from '@/i18n/es.js'
import { formatPrice } from '@/shared/lib/format.js'
import { computeTotalPrice } from '../model/price'

export function Ticket({ roomName, players, pricePerPlayer }) {
  const total = computeTotalPrice({ pricePerPlayer, players })

  return (
    <section className="bg-surface border-line rounded-lg border p-5">
      <h2 className="heading-title">{roomName}</h2>
      <dl className="mt-4 space-y-2">
        <div className="flex justify-between">
          <dt className="text-muted">{es.booking.ticket.players}</dt>
          <dd className="font-mono">{players}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{es.booking.ticket.pricePerPlayer}</dt>
          <dd className="font-mono">{formatPrice(pricePerPlayer)}</dd>
        </div>
        <div className="border-line flex justify-between border-t pt-2">
          <dt>{es.booking.ticket.total}</dt>
          <dd className="text-exit font-mono">{formatPrice(total)}</dd>
        </div>
      </dl>
    </section>
  )
}
