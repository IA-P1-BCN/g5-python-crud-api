// Route page: client bookings with tabs (view, modify, cancel, change slot).
import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import BookingCard from '../components/BookingCard.jsx'
import BookingTabs from '../components/BookingTabs.jsx'
import CancelDialog from '../components/CancelDialog.jsx'
import ChangeSlotDialog from '../components/ChangeSlotDialog.jsx'
import ModifyPlayersDialog from '../components/ModifyPlayersDialog.jsx'
import { useMyBookings } from '../hooks/useMyBookings.js'
import { filterBookings } from '../model/bookingFilters.js'

const t = es.myBookings.page

export default function MyBookingsPage() {
  const [tab, setTab] = useState('upcoming')
  // Which dialog is open, and for which booking: { type: 'modify' | 'changeSlot' | 'cancel', booking } or null.
  const [action, setAction] = useState(null)
  const { data, isPending, isError } = useMyBookings()
  const bookings = data ? filterBookings(data, tab) : []

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="heading-title mb-6">{t.title}</h1>
      <BookingTabs tab={tab} onChange={setTab} />
      <div className="mt-6">
        {isPending && <Spinner label={t.loading} />}
        {isError && <Alert tone="error">{t.loadError}</Alert>}
        {data && bookings.length === 0 && <EmptyState title={t.empty} />}
        {bookings.length > 0 && (
          <ul className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard
                  booking={booking}
                  onModify={(b) => setAction({ type: 'modify', booking: b })}
                  onChangeSlot={(b) => setAction({ type: 'changeSlot', booking: b })}
                  onCancel={(b) => setAction({ type: 'cancel', booking: b })}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {action?.type === 'modify' && (
        <ModifyPlayersDialog booking={action.booking} open onOpenChange={() => setAction(null)} />
      )}
      {action?.type === 'changeSlot' && (
        <ChangeSlotDialog booking={action.booking} open onOpenChange={() => setAction(null)} />
      )}
      {action?.type === 'cancel' && (
        <CancelDialog booking={action.booking} open onOpenChange={() => setAction(null)} />
      )}
    </main>
  )
}
