import { api } from '@/shared/api/client'
import { toSlotPayload, toSlotView } from '../model/slotSchema'

export async function fetchSlots(roomId) {
  const { data } = await api.get('/time-slots', { params: { room_id: roomId, size: 100 } })
  return data.items.map(toSlotView)
}

export async function createSlot(roomId, form) {
  const { data } = await api.post('/time-slots', { room_id: roomId, ...toSlotPayload(form) })
  return toSlotView(data)
}

export async function updateSlot(slotId, form) {
  const { data } = await api.put(`/time-slots/${slotId}`, toSlotPayload(form))
  return toSlotView(data)
}

export async function setSlotStatus(slotId, status) {
  const { data } = await api.put(`/time-slots/${slotId}`, { status }) // 'available' | 'blocked'
  return toSlotView(data)
}

export async function deleteSlot(slotId) {
  await api.delete(`/time-slots/${slotId}`) // 204
}

// Admin only. Times are UTC, like the API. Returns { created_count, skipped_count }.
export async function generateSlots(roomId, payload) {
  const { data } = await api.post(`/rooms/${roomId}/time-slots/generate`, payload)
  return data
}
