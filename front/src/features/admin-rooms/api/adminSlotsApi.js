const API_BASE = '/api/v1/rooms';

export async function fetchSlots(roomId) {
  const res = await fetch(`${API_BASE}/${roomId}/slots`);
  if (!res.ok) throw new Error('Failed to fetch slots');
  return res.json();
}

export async function createSlot(roomId, data) {
  const res = await fetch(`${API_BASE}/${roomId}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function updateSlot(roomId, slotId, data) {
  const res = await fetch(`${API_BASE}/${roomId}/slots/${slotId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function deleteSlot(roomId, slotId) {
  const res = await fetch(`${API_BASE}/${roomId}/slots/${slotId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw json;
  }
  return true;
}