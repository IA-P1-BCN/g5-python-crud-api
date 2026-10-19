// Route page: the planning. Opens on today's bookings; chips switch to all bookings or to one
// status, whatever the date (e.g. every PENDING one to confirm).
import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Chip from '@/shared/ui/Chip.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import TodayBookingsTable from '../components/TodayBookingsTable.jsx'
import { useTodayBookings } from '../hooks/useTodayBookings.js'

// Cancelled bookings are never listed.
const STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']

export default function StaffPlanningPage() {
  const [view, setView] = useState('today')
  const { data, isPending, isError } = useTodayBookings(view)

  const chip = (key, label) => (
    <Chip key={key} selected={view === key} onClick={() => setView(key)}>
      {label}
    </Chip>
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading-title mb-6">{es.staff.title}</h1>
      <div role="group" aria-label={es.staff.filterLabel} className="mb-4 flex flex-wrap gap-2">
        {chip('today', es.staff.filterToday)}
        {chip('ALL', es.staff.filterAll)}
        {STATUSES.map((key) => chip(key, es.staff.statuses[key]))}
      </div>
      {isPending && <Spinner label={es.staff.loading} />}
      {isError && <Alert tone="error">{es.staff.loadError}</Alert>}
      {data?.length === 0 && (
        <EmptyState title={view === 'today' ? es.staff.empty : es.staff.emptyFilter} />
      )}
      {data?.length > 0 && <TodayBookingsTable bookings={data} showDate={view !== 'today'} />}
    </main>
  )
}
