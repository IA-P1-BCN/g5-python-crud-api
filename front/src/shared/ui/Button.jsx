import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn.js'
import Spinner from './Spinner.jsx'

const buttonStyles = cva(
  'inline-flex min-h-11 items-center justify-center rounded-sm px-5 font-bold tracking-wide transition ' +
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-room ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-exit text-on-exit shadow-glow hover:brightness-110',
        room: 'bg-room text-black hover:brightness-110',
        secondary: 'border border-room text-room hover:bg-room-dark',
        ghost: 'text-room hover:bg-room-dark',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

// Generic button. No business logic. `loading` blocks double submits.
export default function Button({
  variant,
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant }), className)}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  )
}
