import { useState } from 'react';

export default function SlotForm({ initialData = { startTime: '', endTime: '', isBlocked: false }, onSubmit, onCancel }) {
  const [startTime, setStartTime] = useState(initialData.startTime);
  const [endTime, setEndTime] = useState(initialData.endTime);
  const [isBlocked, setIsBlocked] = useState(initialData.isBlocked);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ startTime, endTime, isBlocked });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium">Hora de inicio</label>
        <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border rounded" required />
      </div>
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium">Hora de fin</label>
        <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 border rounded" required />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="isBlocked" checked={isBlocked} onChange={(e) => setIsBlocked(e.target.checked)} />
        <label htmlFor="isBlocked" className="text-sm font-medium">Bloqueado</label>
      </div>
      <div className="flex space-x-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>}
      </div>
    </form>
  );
}