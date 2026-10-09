import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn.js'

const badgeStyles = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-zinc-500/20 text-zinc-300',
      success: 'bg-emerald-500/20 text-emerald-300',
      warning: 'bg-amber-500/20 text-amber-300',
      danger: 'bg-red-500/20 text-red-300',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

// Generic status badge. No business logic: the feature chooses the tone for each status.
export default function Badge({ tone, className, ...props }) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />
}
