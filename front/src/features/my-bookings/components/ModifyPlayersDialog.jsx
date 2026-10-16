// Dialog to change the number of players. Reuses PlayersDial from @/features/booking.
import { useState } from 'react'
import { PlayersDial } from '@/features/booking'
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
import { useUpdateBooking } from '../hooks/useUpdateBooking.js'
import { MY_BOOKINGS_ERRORS } from '../model/errors.js'

const t = es.myBookings.modifyDialog

export default function ModifyPlayersDialog({ booking, open, onOpenChange }) {
  const [players, setPlayers] = useState(booking.players)
  const { mutate, isPending, error, reset } = useUpdateBooking()

  function handleOpenChange(next) {
    if (!next) {
      reset() // forget an old error
      setPlayers(booking.players) // and an unsaved choice
    }
    onOpenChange(next)
  }

  function handleSave() {
    mutate({ id: booking.id, players }, { onSuccess: () => handleOpenChange(false) })
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
        <PlayersDial value={players} min={1} max={booking.room.capacity} onChange={setPlayers} />
        {error && <Alert tone="error">{mapApiError(error, MY_BOOKINGS_ERRORS).message}</Alert>}
        <DialogFooter>
          <Button loading={isPending} disabled={players === booking.players} onClick={handleSave}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
