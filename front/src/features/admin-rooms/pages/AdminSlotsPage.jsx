import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminSlots } from '../hooks/useAdminSlots';
import SlotsTable from '../components/SlotsTable';
import SlotForm from '../components/SlotForm';

const t = {
  title: 'Gestión de Franjas Horarias',
  createSlot: 'Crear Franja',
  errors: {
    SLOT_OVERLAP: 'La franja horaria se solapa con otra existente.',
    SLOT_ACTIVE_BOOKING: 'No se puede modificar o eliminar una franja con reserva activa.',
  }
};

export default function AdminSlotsPage() {
  const { id: roomId } = useParams();
  const { slots, loading, createSlot, updateSlot, deleteSlot } = useAdminSlots(roomId);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleSave = async (data) => {
    setActionError(null);
    let res;
    if (editingSlot) {
      res = await updateSlot(editingSlot.id, data);
    } else {
      res = await createSlot(data);
    }
    if (res.success) {
      setShowForm(false);
      setEditingSlot(null);
    } else {
      setActionError(t.errors[res.error] || res.error);
    }
  };

  const handleDelete = async (slotId) => {
    setActionError(null);
    const res = await deleteSlot(slotId);
    if (!res.success) {
      setActionError(t.errors[res.error] || res.error);
    }
  };

  const handleToggleBlock = async (slot) => {
    setActionError(null);
    const res = await updateSlot(slot.id, { ...slot, isBlocked: !slot.isBlocked });
    if (!res.success) {
      setActionError(t.errors[res.error] || res.error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <button onClick={() => { setEditingSlot(null); setShowForm(true); }} className="px-4 py-2 bg-green-600 text-white rounded">
          {t.createSlot}
        </button>
      </div>

      {actionError && <div className="p-3 bg-red-100 text-red-700 rounded">{actionError}</div>}

      {showForm && (
        <SlotForm
          initialData={editingSlot || { startTime: '', endTime: '', isBlocked: false }}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingSlot(null); }}
        />
      )}

      <SlotsTable
        slots={slots}
        onEdit={(slot) => { setEditingSlot(slot); setShowForm(true); }}
        onDelete={handleDelete}
        onToggleBlock={handleToggleBlock}
      />
    </div>
  );
}