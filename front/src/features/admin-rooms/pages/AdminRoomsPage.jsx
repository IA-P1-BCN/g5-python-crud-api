import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { RoomForm } from '../components/RoomForm'
import { RoomsTable } from '../components/RoomsTable'
import { useAdminRooms } from '../hooks/useAdminRooms'
import { DUPLICATE_SLUG_ERROR } from '../model/errors'

export function AdminRoomsPage() {
  const { rooms, loading, error, saveRoom, toggleActive } = useAdminRooms()
  const [apiError, setApiError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (values) => {
    setApiError(null)
    setSuccess(false)
    try {
      await saveRoom(values)
      setSuccess(true)
    } catch (err) {
      const code = err?.response?.data?.code
      setApiError(code === DUPLICATE_SLUG_ERROR ? DUPLICATE_SLUG_ERROR : err?.message)
    }
  }

  const handleToggleActive = async (id, active) => {
    setApiError(null)
    try {
      await toggleActive(id, active)
    } catch (err) {
      setApiError(err?.message)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="heading-hero text-text mb-6">{es.adminRooms.title}</h1>

      {error && <Alert tone="error">{error}</Alert>}

      {success && (
        <div
          role="status"
          className="bg-surface text-text border-confirmed my-4 rounded-lg border px-[18px] py-3.5"
        >
          Sala creada con éxito. Los clientes la verán solo cuando tenga franjas horarias próximas.
        </div>
      )}

      <RoomForm onSubmit={handleSubmit} apiError={apiError} />

      <div className="mt-6">
        {loading ? (
          <Spinner label="Cargando salas..." />
        ) : (
          <RoomsTable rooms={rooms} onToggleActive={handleToggleActive} />
        )}
      </div>
    </main>
  )
}

export default AdminRoomsPage
