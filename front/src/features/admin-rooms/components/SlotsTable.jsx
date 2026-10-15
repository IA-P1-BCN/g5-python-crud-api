export default function SlotsTable({ slots, onEdit, onDelete, onToggleBlock }) {
  return (
    <table className="w-full border-collapse bg-white shadow rounded">
      <thead>
        <tr className="bg-gray-100 border-b text-left">
          <th className="p-3">Inicio</th>
          <th className="p-3">Fin</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr key={slot.id} className="border-b">
            <td className="p-3">{slot.startTime}</td>
            <td className="p-3">{slot.endTime}</td>
            <td className="p-3">{slot.isBlocked ? 'Bloqueado' : 'Disponible'}</td>
            <td className="p-3 space-x-2">
              <button onClick={() => onEdit(slot)} className="text-blue-600 hover:underline">Editar</button>
              <button onClick={() => onToggleBlock(slot)} className="text-yellow-600 hover:underline">
                {slot.isBlocked ? 'Desbloquear' : 'Bloquear'}
              </button>
              <button onClick={() => onDelete(slot.id)} className="text-red-600 hover:underline">Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}