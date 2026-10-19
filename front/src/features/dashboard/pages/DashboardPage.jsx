import { useAuth } from '@/features/auth'
import es from '@/i18n/es.js'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="heading-title mb-6">{es.dashboard.title}</h1>
      <p>{es.dashboard.welcome(user?.name ?? user?.email ?? '')}</p>
    </main>
  )
}
