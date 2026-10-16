// Dialog to pick another slot of the same room. Reuses DayPicker/SlotGrid/useSlots from @/features/booking.
import { useState } from 'react'
import { DayPicker, SlotGrid, getUpcomingDates, useSlots } from '@/features/booking'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx'
import { useChangeSlot } from '../hooks/useChangeSlot.js'
import { MY_BOOKINGS_ERRORS } from '../model/errors.js'

const t = es.myBookings.changeSlotDialog

// The new slot must be 24h or more away (BR-L5), so offer a week, not just 3 days.
const DAYS_OFFERED = 7

export default function ChangeSlotDialog({ booking, open, onOpenChange }) {
  const dates = getUpcomingDates(DAYS_OFFERED)
  const [date, setDate] = useState(dates[0].dateString)
  const [slot, setSlot] = useState(null)
  const { data: slots = [], isPending, isError } = useSlots(booking.room.id, date)
  const { mutate, isPending: saving, error, reset } = useChangeSlot()

  function handleOpenChange(next) {
    if (!next) {
      reset() // forget an old error
      setSlot(null) // and an unsaved choice
    }
    onOpenChange(next)
  }

  function handleDateChange(nextDate) {
    setDate(nextDate)
    setSlot(null) // a slot of another day must not stay selected
  }

  function handleSave() {
    mutate({ id: booking.id, timeSlotId: slot.id }, { onSuccess: () => handleOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description.replace('{room}', booking.room.name)}
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          <h3 className="label-caps text-muted">{es.booking.selectDate}</h3>
          <DayPicker selectedDate={date} onSelectDate={handleDateChange} dates={dates} />
        </section>
        <section className="space-y-2">
          <h3 className="label-caps text-muted">{es.booking.selectTime}</h3>
          {isPending && <p className="text-muted">{es.booking.loadingSlots}</p>}
          {isError && <p className="text-error">{es.booking.errors.loadFailed}</p>}
          {!isPending && !isError && (
            <SlotGrid slots={slots} selectedSlot={slot} onSelectSlot={setSlot} />
          )}
        </section>
        {error && <Alert tone="error">{mapApiError(error, MY_BOOKINGS_ERRORS).message}</Alert>}
        <DialogFooter>
          <Button loading={saving} disabled={!slot} onClick={handleSave}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
