// Route page: today's planning, start and finish a game. Chips filter the list by status.
import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Chip from '@/shared/ui/Chip.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Field from '@/shared/ui/Field.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import TodayBookingsTable from '../components/TodayBookingsTable.jsx'
import { useTodayBookings } from '../hooks/useTodayBookings.js'

// The API already leaves cancelled bookings out of today's list.
const STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']

export default function StaffPlanningPage() {
  const [day, setDay] = useState('') // '' = today
  const { data, isPending, isError } = useTodayBookings(day)
  const [status, setStatus] = useState(null) // null = all
  const shown = status ? data?.filter((b) => b.status === status) : data

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading-title mb-6">{es.staff.title}</h1>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field
          label={es.staff.day}
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
        {day && (
          <Button variant="secondary" onClick={() => setDay('')}>
            {es.staff.today}
          </Button>
        )}
      </div>
      {isPending && <Spinner label={es.staff.loading} />}
      {isError && <Alert tone="error">{es.staff.loadError}</Alert>}
      {data?.length === 0 && <EmptyState title={day ? es.staff.emptyDay : es.staff.empty} />}
      {data?.length > 0 && (
        <div role="group" aria-label={es.staff.filterLabel} className="mb-4 flex flex-wrap gap-2">
          <Chip selected={status === null} onClick={() => setStatus(null)}>
            {es.staff.filterAll}
          </Chip>
          {STATUSES.map((key) => (
            <Chip key={key} selected={status === key} onClick={() => setStatus(key)}>
              {es.staff.statuses[key]}
            </Chip>
          ))}
        </div>
      )}
      {data?.length > 0 && shown.length === 0 && <EmptyState title={es.staff.emptyFilter} />}
      {shown?.length > 0 && <TodayBookingsTable bookings={shown} />}
    </main>
  )
}
