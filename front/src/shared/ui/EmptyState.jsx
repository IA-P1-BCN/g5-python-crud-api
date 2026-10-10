import { cn } from '../lib/cn.js'

// "Nothing here yet" block for empty lists. `action` is whatever the page wants (usually a Button).
export default function EmptyState({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 text-center', className)}>
      <h2 className="heading-title">{title}</h2>
      {description && <p className="text-muted max-w-md">{description}</p>}
      {action}
    </div>
  )
}
