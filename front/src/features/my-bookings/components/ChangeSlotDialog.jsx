// Dialog to pick another slot, in this room or another one (BR-L5). Reuses DayPicker/SlotGrid/useSlots from @/features/booking.
import { useState } from 'react'
import { DayPicker, SlotGrid, getUpcomingDates, useSlots } from '@/features/booking'
import { useRooms } from '@/features/rooms'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Chip from '@/shared/ui/Chip.jsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx'
import { useChangeSlot } from '../hooks/useChangeSlot.js'
import { isAtLeast24hAway } from '../model/canModify.js'
import { MY_BOOKINGS_ERRORS } from '../model/errors.js'

const t = es.myBookings.changeSlotDialog

// The new slot must be 24h or more away (BR-L5): offer a week, and hide slots that are too close.
const DAYS_OFFERED = 7

export default function ChangeSlotDialog({ booking, open, onOpenChange }) {
  const dates = getUpcomingDates(DAYS_OFFERED)
  const [date, setDate] = useState(dates[0].dateString)
  const [slot, setSlot] = useState(null)
  const [roomId, setRoomId] = useState(booking.room.id)
  const { data: rooms = [] } = useRooms()
  // Only rooms where the current players fit (BR-B2); the current room is always offered.
  const offeredRooms = rooms.filter(
    (r) => r.id === booking.room.id || r.maxPlayers >= booking.players,
  )
  const { data: slots = [], isPending, isError } = useSlots(roomId, date)
  const { mutate, isPending: saving, error, reset } = useChangeSlot()

  function handleOpenChange(next) {
    if (!next) {
      reset() // forget an old error
      setSlot(null) // and an unsaved choice
      setRoomId(booking.room.id)
    }
    onOpenChange(next)
  }

  function handleDateChange(nextDate) {
    setDate(nextDate)
    setSlot(null) // a slot of another day must not stay selected
  }

  function handleRoomChange(nextRoomId) {
    setRoomId(nextRoomId)
    setSlot(null) // nor a slot of another room
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
        {offeredRooms.length > 1 && (
          <section className="space-y-2">
            <h3 className="label-caps text-muted">{t.room}</h3>
            <div className="flex flex-wrap gap-2">
              {offeredRooms.map((r) => (
                <Chip key={r.id} selected={r.id === roomId} onClick={() => handleRoomChange(r.id)}>
                  {r.name}
                </Chip>
              ))}
            </div>
          </section>
        )}
        <section className="space-y-2">
          <h3 className="label-caps text-muted">{es.booking.selectDate}</h3>
          <DayPicker selectedDate={date} onSelectDate={handleDateChange} dates={dates} />
        </section>
        <section className="space-y-2">
          <h3 className="label-caps text-muted">{es.booking.selectTime}</h3>
          {isPending && <p className="text-muted">{es.booking.loadingSlots}</p>}
          {isError && <p className="text-error">{es.booking.errors.loadFailed}</p>}
          {!isPending && !isError && (
            <SlotGrid
              slots={slots.filter((s) => isAtLeast24hAway(s.startsAt))}
              selectedSlot={slot}
              onSelectSlot={setSlot}
            />
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
