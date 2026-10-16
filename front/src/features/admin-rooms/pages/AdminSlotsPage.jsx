import { useState } from 'react'
import { useParams } from 'react-router-dom'
import adminRooms from '@/i18n/es/adminRooms'
import { useAdminSlots } from '../hooks/useAdminSlots'
import SlotsTable from '../components/SlotsTable'
import SlotForm from '../components/SlotForm'

const t = adminRooms.slots
const errorMessage = (code) => t.errors[code] ?? t.errors.UNKNOWN

export default function AdminSlotsPage() {
  const { id: roomId } = useParams()
  const { slots, loading, loadError, createSlot, updateSlot, setBlocked, deleteSlot } =
    useAdminSlots(roomId)
  const [editingSlot, setEditingSlot] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState(null)

  const openForm = (slot = null) => {
    setEditingSlot(slot)
    setShowForm(true)
  }
  const closeForm = () => {
    setShowForm(false)
    setEditingSlot(null)
  }

  const report = (res) => {
    setActionError(res.success ? null : errorMessage(res.error))
    return res.success
  }

  const handleSave = async (data) => {
    const res = editingSlot ? await updateSlot(editingSlot.id, data) : await createSlot(data)
    if (report(res)) closeForm()
  }
  const handleDelete = async (slot) => report(await deleteSlot(slot.id))
  const handleToggleBlock = async (slot) => report(await setBlocked(slot.id, !slot.isBlocked))

  if (loading) return <p role="status">{t.loading}</p>

  const message = actionError ?? (loadError ? errorMessage(loadError) : null)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <button onClick={() => openForm()} className="rounded border px-4 py-2">
          {t.createSlot}
        </button>
      </div>

      {message && (
        <div role="alert" className="rounded border p-3">
          {message}
        </div>
      )}

      {showForm && (
        <SlotForm
          key={editingSlot?.id ?? 'new'}
          initialData={editingSlot ?? undefined}
          onSubmit={handleSave}
          onCancel={closeForm}
        />
      )}

      <SlotsTable
        slots={slots}
        onEdit={openForm}
        onDelete={handleDelete}
        onToggleBlock={handleToggleBlock}
      />
    </div>
  )
}
