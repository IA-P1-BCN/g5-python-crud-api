import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn.js'

const alertStyles = cva('my-4 rounded-lg border bg-surface px-[18px] py-3.5 text-text', {
  variants: {
    tone: {
      error: 'border-error',
      success: 'border-confirmed',
      info: 'border-in-progress',
    },
  },
  defaultVariants: { tone: 'info' },
})

// Inline message box. Errors use role="alert" (announced at once); the rest use role="status"
// (announced when the screen reader is idle).
export default function Alert({ tone, className, ...props }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(alertStyles({ tone }), className)}
      {...props}
    />
  )
}
