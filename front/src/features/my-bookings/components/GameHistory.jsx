// Presentational: list of past games with their result. Props only.
import es from '@/i18n/es.js'
import Badge from '@/shared/ui/Badge.jsx'

const t = es.myBookings.history

// 2710 s -> "45:10"
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function ResultBadge({ result }) {
  if (!result) return <Badge tone="neutral">{t.noResult}</Badge>
  return result.completed ? (
    <Badge tone="confirmed">{t.escaped}</Badge>
  ) : (
    <Badge tone="error">{t.failed}</Badge>
  )
}

export default function GameHistory({ games }) {
  return (
    <ul className="flex flex-col gap-3">
      {games.map((game) => (
        <li
          key={game.id}
          className="bg-surface border-line flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
        >
          <div>
            <p className="heading-title">{game.room.name}</p>
            <p className="text-muted">
              {new Date(game.time_slot.starts_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {game.result && (
              <span className="font-mono" aria-label={t.time}>
                {formatDuration(game.result.completion_time)}
              </span>
            )}
            <ResultBadge result={game.result} />
          </div>
        </li>
      ))}
    </ul>
  )
}
