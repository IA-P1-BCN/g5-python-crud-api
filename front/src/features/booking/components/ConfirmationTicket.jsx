import texts from '@/i18n/es/booking'

export function ConfirmationTicket({ bookingId, clientName, slotId }) {
  const t = texts.confirmation.ticket

  return (
    <div className="bg-surface-2 border-line relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-dashed">
      <div className="bg-surface text-text p-5 text-center">
        <h3 className="text-xl font-bold tracking-[0.2em] uppercase">{t.header}</h3>
      </div>

      <div className="space-y-6 p-8">
        <div className="border-line flex flex-col border-b pb-2">
          <span className="text-muted text-xs font-semibold uppercase">{t.bookingId}</span>
          <span className="text-text font-mono text-lg font-bold">{bookingId || t.pending}</span>
        </div>

        <div className="border-line flex flex-col border-b pb-2">
          <span className="text-muted text-xs font-semibold uppercase">{t.holder}</span>
          <span className="text-text text-lg font-medium">
            {clientName || texts.checkout.unspecified}
          </span>
        </div>

        <div className="border-line flex flex-col border-b pb-2">
          <span className="text-muted text-xs font-semibold uppercase">
            {t.date} / {t.time}
          </span>
          <span className="text-text text-lg font-medium">{slotId}</span>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationTicket
