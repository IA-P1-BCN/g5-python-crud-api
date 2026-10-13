import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn.js'

const badgeStyles = cva('inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-muted/20 text-muted',
      pending: 'bg-pending/15 text-pending',
      confirmed: 'bg-confirmed/15 text-confirmed',
      'in-progress': 'bg-in-progress/15 text-in-progress',
      done: 'bg-done/15 text-done',
      cancelled: 'bg-cancelled/15 text-cancelled',
      error: 'bg-error/15 text-error',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

// Generic status badge. No business logic: the feature chooses the tone for each status
// (pending, confirmed, in-progress, done, cancelled map to the booking states).
export default function Badge({ tone, className, ...props }) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />
}
