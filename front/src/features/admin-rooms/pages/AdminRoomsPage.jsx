import { useState } from 'react'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
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

  // Runs an API call and shows its error in Spanish; returns true when it worked.
  const run = async (action) => {
    setActionError(null)
    setSuccess(false)
    try {
      await action()
      return true
    } catch (err) {
      setActionError(mapApiError(err, t.errors).message)
      return false
    }
  }

  const handleSubmit = async (values) => {
    const ok = await run(() => saveRoom(values))
    setSuccess(ok)
    return ok
  }

  const handleToggleActive = (id, active) => run(() => toggleActive(id, active))

  const message = actionError ?? error

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="heading-hero text-text mb-6">{t.title}</h1>

      {message && <Alert tone="error">{message}</Alert>}
      {success && <Alert tone="success">{t.createSuccess}</Alert>}

      <RoomForm onSubmit={handleSubmit} />

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
