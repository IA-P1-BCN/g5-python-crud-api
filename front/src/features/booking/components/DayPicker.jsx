// Presentational: day selection. Props only.
export function DayPicker({ selectedDate, onSelectDate, dates = [] }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {dates.map((dateObj) => {
        const isSelected = selectedDate === dateObj.dateString
        return (
          <button
            key={dateObj.dateString}
            type="button"
            onClick={() => onSelectDate(dateObj.dateString)}
            className={`rounded-lg border px-4 py-2 transition-colors ${
              isSelected
                ? 'bg-primary text-primary-contrast border-primary'
                : 'bg-surface text-text-main border-border hover:bg-surface-hover'
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
