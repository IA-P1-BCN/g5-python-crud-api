import { mapApiError } from '@/shared/api/errors.js'
import es from '@/i18n/es.js'
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
import { useCancelBooking } from '../hooks/useCancelBooking.js'
import { MY_BOOKINGS_ERRORS } from '../model/errors.js'

const t = es.myBookings.cancelDialog

export default function CancelDialog({ booking, open, onOpenChange }) {
  const { mutate, isPending, error, reset } = useCancelBooking()

  function handleOpenChange(next) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleConfirm() {
    mutate(booking.id, { onSuccess: () => handleOpenChange(false) })
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
        {error && <Alert tone="error">{mapApiError(error, MY_BOOKINGS_ERRORS).message}</Alert>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {t.keep}
          </Button>
          <Button loading={isPending} onClick={handleConfirm}>
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
