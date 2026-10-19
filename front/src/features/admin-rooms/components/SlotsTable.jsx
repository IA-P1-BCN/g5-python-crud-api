import Button from '@/shared/ui/Button.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import adminRooms from '@/i18n/es/adminRooms'

const t = adminRooms.slots

const formatDate = (date) => {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function SlotsTable({ slots, onEdit, onDelete, onToggleBlock }) {
  return (
    <table className="border-line w-full border-collapse border-t text-left text-sm">
      <thead>
        <tr className="text-muted text-xs uppercase">
          <th scope="col" className="p-3">
            {t.table.date}
          </th>
          <th scope="col" className="p-3">
            {t.table.start}
          </th>
          <th scope="col" className="p-3">
            {t.table.end}
          </th>
          <th scope="col" className="p-3">
            {t.table.status}
          </th>
          <th scope="col" className="p-3">
            {t.table.actions}
          </th>
        </tr>
      </thead>
      <tbody>
        {slots.length === 0 && (
          <tr>
            <td colSpan={5}>
              <EmptyState title={t.empty} />
            </td>
          </tr>
        )}
        {slots.map((slot) => {
          const isPast = slot.state === 'past'
          return (
            <tr key={slot.id} className="border-line border-t">
              <td className="p-3">{formatDate(slot.date)}</td>
              <td className="p-3">{slot.startTime}</td>
              <td className="p-3">{slot.endTime}</td>
              <td className="p-3">{t.status[slot.state] ?? t.status.free}</td>
              <td className="space-x-2 p-3 whitespace-nowrap">
                <Button variant="ghost" onClick={() => onEdit(slot)} disabled={isPast}>
                  {t.actions.edit}
                </Button>
                <Button variant="ghost" onClick={() => onToggleBlock(slot)} disabled={isPast}>
                  {slot.isBlocked ? t.actions.unblock : t.actions.block}
                </Button>
                <Button variant="ghost" onClick={() => onDelete(slot)}>
                  {t.actions.delete}
                </Button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
