import { api } from '@/shared/api/client'
import { toSlotPayload, toSlotView } from '../model/slotSchema'

const PAGE_SIZE = 100

export async function fetchSlots(roomId) {
  const slots = []
  for (let page = 1; ; page++) {
    const { data } = await api.get('/time-slots', {
      params: { room_id: roomId, page, size: PAGE_SIZE },
    })
    slots.push(...data.items)
    if (slots.length >= data.total || data.items.length === 0) break
  }
  return slots.map(toSlotView)
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
  const { data } = await api.put(`/time-slots/${slotId}`, { status })
  return toSlotView(data)
}

export async function deleteSlot(slotId) {
  await api.delete(`/time-slots/${slotId}`)
}

export async function generateSlots(roomId, payload) {
  const { data } = await api.post(`/rooms/${roomId}/time-slots/generate`, payload)
  return data
}
