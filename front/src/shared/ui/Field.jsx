import { useId } from 'react'
import { cn } from '../lib/cn.js'

// Label + input + error message. `ref` is a normal prop in React 19, so
// <Field label="Email" error={errors.email?.message} {...register('email')} /> just works.
export default function Field({ label, error, className, ...props }) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-muted text-sm">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'border-line bg-surface-2 text-text min-h-11 rounded-md border px-3 ' +
            'focus-visible:outline-exit focus-visible:outline-3 focus-visible:outline-offset-2 ' +
            (error ? 'border-error' : ''),
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
