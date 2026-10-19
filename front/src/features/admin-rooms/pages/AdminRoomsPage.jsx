import { useState } from 'react'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog.jsx'
import Pagination from '@/shared/ui/Pagination.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { RoomForm } from '../components/RoomForm'
import { RoomsTable } from '../components/RoomsTable'
import { useAdminRooms } from '../hooks/useAdminRooms'

const t = es.adminRooms

export function AdminRoomsPage() {
  const { rooms, loading, error, page, size, total, setPage, saveRoom, toggleActive } =
    useAdminRooms()
  const [actionError, setActionError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState(null)
  const [open, setOpen] = useState(false)

  // Runs an API call and shows its error in Spanish; returns true when it worked.
  const run = async (action, setError) => {
    setError(null)
    setSuccess(false)
    try {
      await action()
      return true
    } catch (err) {
      setError(mapApiError(err, t.errors).message)
      return false
    }
  }

  // The form lives in a dialog: its error shows inside it, and it closes once the room is saved.
  const handleSubmit = async (values) => {
    const ok = await run(() => saveRoom(values), setFormError)
    setSuccess(ok)
    if (ok) setOpen(false)
    return ok
  }

  const handleToggleActive = (id, active) => run(() => toggleActive(id, active), setActionError)

  const message = actionError ?? error

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-hero text-text">{t.title}</h1>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (next) setFormError(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>{t.create}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.createTitle}</DialogTitle>
              <DialogDescription className="sr-only">{t.createTitle}</DialogDescription>
            </DialogHeader>
            {formError && <Alert tone="error">{formError}</Alert>}
            <RoomForm onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {message && <Alert tone="error">{message}</Alert>}
      {success && <Alert tone="success">{t.createSuccess}</Alert>}

      <div className="mt-6">
        {loading ? (
          <Spinner label={t.loading} />
        ) : (
          <>
            <RoomsTable rooms={rooms} onToggleActive={handleToggleActive} />
            <Pagination page={page} size={size} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </main>
  )
}

export default AdminRoomsPage
