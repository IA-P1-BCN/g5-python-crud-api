import { cn } from '../lib/cn.js'

// Generic loading placeholder. No business logic. Size it with className (h-40 w-full...).
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-surface-2 animate-pulse rounded-lg motion-reduce:animate-none', className)}
    />
  )
}
