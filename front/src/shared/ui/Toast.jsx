import { cva } from 'class-variance-authority'
import es from '@/i18n/es.js'
import { cn } from '../lib/cn.js'

const toastStyles = cva('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-zinc-600 bg-zinc-900 text-zinc-100',
      success: 'border-emerald-500/50 bg-emerald-950 text-emerald-100',
      danger: 'border-red-500/50 bg-red-950 text-red-100',
    },
  },
  defaultVariants: { tone: 'info' },
})

// Generic toast notification. No business logic. Errors use role="alert" so screen readers
// announce them at once; the rest are polite statuses.
export default function Toast({ tone, onClose, className, children }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(toastStyles({ tone }), className)}
    >
      <p className="flex-1">{children}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={es.common.close}
          className="-my-2 -mr-2 min-h-11 min-w-11 rounded-lg hover:bg-white/10"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
