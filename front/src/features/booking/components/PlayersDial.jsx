import { cn } from '@/shared/lib/cn.js'
import es from '@/i18n/es.js'

const ARC = 120
const RADIUS = 112

const angleOf = (n, min, max) => (max === min ? 0 : -ARC / 2 + ((n - min) * ARC) / (max - min))

export function PlayersDial({ value, min, max, onChange }) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        role="group"
        aria-label={es.booking.selectPlayers}
        className="relative h-[150px] w-[250px]"
      >
        {numbers.map((n) => {
          const angle = angleOf(n, min, max)
          return (
            <button
              key={n}
              type="button"
              aria-pressed={n === value}
              onClick={() => onChange(n)}
              style={{
                transform: `rotate(${angle}deg) translateY(-${RADIUS}px) rotate(${-angle}deg)`,
              }}
              className={cn(
                'rounded-pill absolute top-[128px] left-1/2 -m-[22px] size-11 border font-mono text-xl transition-colors',
                n === value
                  ? 'bg-exit text-on-exit border-exit'
                  : 'bg-surface text-text border-line hover:border-exit',
              )}
            >
              {n}
            </button>
          )
        })}
        <div
          aria-hidden="true"
          style={{ transform: `rotate(${angleOf(value, min, max)}deg)` }}
          className="bg-surface-2 border-line rounded-pill pointer-events-none absolute top-[128px] left-1/2 -m-[59px] size-[118px] border-4 shadow-lg transition-transform duration-300"
        >
          <span className="bg-exit shadow-glow absolute top-1.5 left-1/2 h-[34px] w-1.5 -translate-x-1/2 rounded-sm" />
          <span className="bg-bg rounded-pill absolute inset-[34%]" />
        </div>
      </div>
      <p aria-hidden="true" className="text-exit font-mono text-6xl leading-none">
        {value}
        <small className="text-muted block text-xs tracking-widest uppercase">
          {es.booking.playersUnit}
        </small>
      </p>
    </div>
  )
}
