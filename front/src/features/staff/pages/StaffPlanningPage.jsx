// Route page: today's planning, start and finish a game.
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import TodayBookingsTable from '../components/TodayBookingsTable.jsx'
import { useTodayBookings } from '../hooks/useTodayBookings.js'

export default function StaffPlanningPage() {
  const { data, isPending, isError } = useTodayBookings()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading-title mb-6">{es.staff.title}</h1>
      {isPending && <Spinner label={es.staff.loading} />}
      {isError && <Alert tone="error">{es.staff.loadError}</Alert>}
      {data?.length === 0 && <EmptyState title={es.staff.empty} />}
      {data?.length > 0 && <TodayBookingsTable bookings={data} />}
    </main>
  )
}
