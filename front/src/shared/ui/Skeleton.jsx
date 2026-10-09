import { cn } from '../lib/cn.js'

// Generic loading placeholder. No business logic. Size it with className (h-40 w-full...).
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-zinc-700/50 motion-reduce:animate-none',
        className,
      )}
    />
  )
}
