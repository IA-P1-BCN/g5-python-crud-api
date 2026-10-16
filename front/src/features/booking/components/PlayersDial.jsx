// Controlled component: PlayersDial({ value, min, max, onChange }). Knows nothing about rooms.
import { cn } from '@/shared/lib/cn.js'

export function PlayersDial({ value, min, max, onChange }) {
  // One button per allowed number: a number outside min..max does not exist, so it cannot be picked.
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div role="group" className="flex flex-wrap gap-3">
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={n === value}
          onClick={() => onChange(n)}
          className={cn(
            'rounded-pill size-11 border font-mono text-xl transition-colors',
            n === value
              ? 'bg-exit text-on-exit border-exit'
              : 'bg-surface text-text border-line hover:border-exit',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
