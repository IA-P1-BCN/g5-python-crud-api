// Presentational: slot grid with disabled states. Props only.
import { isSlotSelectable } from '../model/slotState'
import es from '@/i18n/es.js'

export function SlotGrid({ slots = [], selectedSlot, onSelectSlot }) {
  if (slots.length === 0) {
    return <p className="text-muted py-4 text-center">{es.booking.noSlotsAvailable}</p>
  }

  return (
    <div
      role="group"
      aria-label={es.booking.selectTime}
      className="grid grid-cols-3 gap-3 sm:grid-cols-4"
    >
      {slots.map((slot) => {
        const selectable = isSlotSelectable(slot.state)
        const isSelected = selectedSlot?.id === slot.id

        let stateClasses = 'bg-surface border-border text-text'
        if (slot.state === 'past') {
          stateClasses = 'bg-surface-2 text-muted opacity-50 cursor-not-allowed'
        } else if (slot.state === 'blocked' || slot.state === 'taken') {
          stateClasses = 'bg-surface-2 text-muted cursor-not-allowed border-dashed'
        } else if (isSelected) {
          stateClasses = 'bg-primary text-primary-foreground border-primary ring-2 ring-primary'
        } else if (selectable) {
          stateClasses = 'bg-surface hover:border-primary text-text cursor-pointer'
        }

        return (
          <button
            key={slot.id}
            type="button"
            disabled={!selectable}
            onClick={() => selectable && onSelectSlot(slot)}
            className={`rounded-lg border p-3 text-center font-medium transition-all ${stateClasses}`}
          >
            {slot.time}
          </button>
        )
      })}
    </div>
  )
}
