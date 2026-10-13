import { cn } from '../lib/cn.js'

// Loading indicator. With a label it is a status for screen readers (pages: es.common.loading);
// without one it is decoration (inside a loading Button, which already has aria-busy).
export default function Spinner({ label, className }) {
  return (
    <span
      data-slot="spinner"
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': 'true' })}
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none',
        className,
      )}
    />
  )
}
