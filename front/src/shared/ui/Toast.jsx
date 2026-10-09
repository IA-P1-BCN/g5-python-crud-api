import { cva } from 'class-variance-authority'
import es from '@/i18n/es.js'
import { cn } from '../lib/cn.js'

const toastStyles = cva('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-line bg-surface text-text',
      success: 'border-confirmed/50 bg-surface text-text',
      error: 'border-error/50 bg-surface text-text',
    },
  },
  defaultVariants: { tone: 'info' },
})

// Generic toast notification. No business logic. Errors use role="alert" so screen readers
// announce them at once; the rest are polite statuses.
export default function Toast({ tone, onClose, className, children }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(toastStyles({ tone }), className)}
    >
      <p className="flex-1">{children}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={es.common.close}
          className="hover:bg-surface-2 -my-2 -mr-2 min-h-11 min-w-11 rounded-lg"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
