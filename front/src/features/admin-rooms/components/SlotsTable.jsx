import adminRooms from '@/i18n/es/adminRooms'

const t = adminRooms.slots

const formatDate = (date) => {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function SlotsTable({ slots, onEdit, onDelete, onToggleBlock }) {
  return (
    <table className="w-full border-collapse rounded shadow">
      <thead>
        <tr className="border-b text-left">
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
            <td colSpan={5} className="p-3">
              {t.empty}
            </td>
          </tr>
        )}
        {slots.map((slot) => {
          const isPast = slot.state === 'past'
          return (
            <tr key={slot.id} className="border-b">
              <td className="p-3">{formatDate(slot.date)}</td>
              <td className="p-3">{slot.startTime}</td>
              <td className="p-3">{slot.endTime}</td>
              <td className="p-3">{t.status[slot.state] ?? t.status.free}</td>
              <td className="space-x-2 p-3">
                <button onClick={() => onEdit(slot)} disabled={isPast} className="underline">
                  {t.actions.edit}
                </button>
                <button onClick={() => onToggleBlock(slot)} disabled={isPast} className="underline">
                  {slot.isBlocked ? t.actions.unblock : t.actions.block}
                </button>
                <button onClick={() => onDelete(slot)} className="underline">
                  {t.actions.delete}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
