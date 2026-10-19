import { useId } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { usePlayerStats } from '../hooks/usePlayerStats.js'

const t = es.profile

export default function ScoreBoard() {
  const titleId = useId()
  const { data, isPending, isError } = usePlayerStats()

  return (
    <section
      aria-labelledby={titleId}
      className="border-line bg-surface mt-10 rounded-lg border p-6"
    >
      <h2 id={titleId} className="label-caps mb-4">
        {t.scoreTitle}
      </h2>
      {isPending && <Spinner label={es.common.loading} />}
      {isError && <Alert tone="error">{t.scoreLoadError}</Alert>}
      {data && (
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[
            [t.played, data.played],
            [t.escaped, data.escaped],
            [t.bestTime, data.bestTime],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="font-display text-3xl">{value}</dd>
              <dt className="text-muted text-sm">{label}</dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
