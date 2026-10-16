// Route page: client bookings with tabs (view, modify, cancel, change slot).
import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import BookingCard from '../components/BookingCard.jsx'
import BookingTabs from '../components/BookingTabs.jsx'
import { useMyBookings } from '../hooks/useMyBookings.js'
import { filterBookings } from '../model/bookingFilters.js'

const t = es.myBookings.page

export default function MyBookingsPage() {
  const [tab, setTab] = useState('upcoming')
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
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
