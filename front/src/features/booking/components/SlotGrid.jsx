// Presentational: slot grid with disabled states. Props only.
import { isSlotSelectable } from '../model/slotState'

export function SlotGrid({ slots = [], selectedSlot, onSelectSlot }) {
  if (slots.length === 0) {
    return <p className="text-muted text-center py-4">No hay horarios disponibles para esta fecha.</p>
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const selectable = isSlotSelectable(slot.state)
        const isSelected = selectedSlot?.id === slot.id

        let stateClasses = 'bg-surface border-border text-text-main'
        if (slot.state === 'past') {
          stateClasses = 'bg-surface-disabled text-muted opacity-50 cursor-not-allowed'
        } else if (slot.state === 'blocked' || slot.state === 'taken') {
          stateClasses = 'bg-surface-muted text-muted cursor-not-allowed border-dashed'
        } else if (isSelected) {
          stateClasses = 'bg-primary text-primary-contrast border-primary ring-2 ring-primary'
        } else if (selectable) {
          stateClasses = 'bg-surface hover:border-primary text-text-main cursor-pointer'
        }

        return (
          <button
            key={slot.id}
            type="button"
            disabled={!selectable}
            onClick={() => selectable && onSelectSlot(slot)}
            className={`p-3 rounded-lg border text-center font-medium transition-all ${stateClasses}`}
          >
            {slot.time}
          </button>
        )
      })}
    </div>
  )
}
