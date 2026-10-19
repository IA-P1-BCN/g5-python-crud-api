// Presentational: day selection. Props only.
import es from '@/i18n/es.js'

export function DayPicker({ selectedDate, onSelectDate, dates = [] }) {
  return (
    <div role="group" aria-label={es.booking.selectDay} className="flex gap-2 overflow-x-auto py-2">
      {dates.map((dateObj) => {
        const isSelected = selectedDate === dateObj.dateString
        return (
          <button
            key={dateObj.dateString}
            type="button"
            onClick={() => onSelectDate(dateObj.dateString)}
            className={`rounded-lg border px-4 py-2 transition-colors ${
              isSelected
                ? 'bg-exit text-on-exit border-exit'
                : 'bg-surface text-text border-line hover:bg-surface-2'
            }`}
          >
            <span className="block text-xs uppercase">{dateObj.dayOfWeek}</span>
            <span className="block text-lg font-bold">{dateObj.dayNumber}</span>
          </button>
        )
      })}
    </div>
  )
}
