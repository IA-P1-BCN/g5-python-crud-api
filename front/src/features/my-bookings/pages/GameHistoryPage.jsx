// Route page: client game history (past bookings with result).
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import GameHistory from '../components/GameHistory.jsx'
import { useGameHistory } from '../hooks/useGameHistory.js'

const t = es.myBookings.history

export default function GameHistoryPage() {
  const { data, isPending, isError } = useGameHistory()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="heading-title mb-6">{t.title}</h1>
      {isPending && <Spinner label={t.loading} />}
      {isError && <Alert tone="error">{t.loadError}</Alert>}
      {data?.length === 0 && <EmptyState title={t.empty} />}
      {data?.length > 0 && <GameHistory games={data} />}
    </main>
  )
}
