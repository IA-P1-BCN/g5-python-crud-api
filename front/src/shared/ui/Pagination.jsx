import es from '@/i18n/es.js'
import Button from './Button.jsx'

export default function Pagination({ page, size, total, onPageChange }) {
  const pages = Math.ceil(total / size)
  if (pages <= 1) return null
  const first = page <= 1
  const last = page >= pages

  return (
    <nav aria-label={es.common.pagination} className="flex items-center justify-center gap-4">
      <Button
        variant="secondary"
        aria-disabled={first || undefined}
        onClick={() => !first && onPageChange(page - 1)}
      >
        {es.common.previous}
      </Button>
      <span className="text-muted text-sm">{es.common.pageOf(page, pages)}</span>
      <Button
        variant="secondary"
        aria-disabled={last || undefined}
        onClick={() => !last && onPageChange(page + 1)}
      >
        {es.common.next}
      </Button>
    </nav>
  )
}
