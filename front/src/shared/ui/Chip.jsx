import { cn } from '../lib/cn.js'

// Generic toggle chip (filters, tabs). No business logic.
export default function Chip({ selected = false, className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition',
        'focus-visible:outline-room focus-visible:outline-3 focus-visible:outline-offset-2',
        selected
          ? 'border-room bg-room text-black'
          : 'hover:border-room hover:text-room border-line text-muted',
        className,
      )}
      {...props}
    />
  )
}
