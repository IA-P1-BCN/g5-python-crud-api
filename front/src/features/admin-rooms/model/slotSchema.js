import { z } from 'zod'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const pad = (n) => String(n).padStart(2, '0')

const time = z.string().min(1, 'required').regex(TIME_RE, 'invalidTime')

export const slotSchema = z
  .object({
    date: z.string().min(1, 'required'),
    startTime: time,
    endTime: time,
  })
  .refine((s) => s.endTime > s.startTime, { path: ['endTime'], message: 'endBeforeStart' })
  .refine((s) => new Date(`${s.date}T${s.startTime}`) > new Date(), {
    path: ['startTime'],
    message: 'startInPast',
  })

export const toIsoUtc = (date, time) => new Date(`${date}T${time}`).toISOString()

export function fromIso(iso) {
  const d = new Date(iso)
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function toSlotPayload({ date, startTime, endTime }) {
  return { starts_at: toIsoUtc(date, startTime), ends_at: toIsoUtc(date, endTime) }
}

export function toSlotView(apiSlot) {
  const start = fromIso(apiSlot.starts_at)
  const end = fromIso(apiSlot.ends_at)
  return {
    id: apiSlot.id,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    isBlocked: apiSlot.status === 'blocked',
    state: apiSlot.state,
  }
}
