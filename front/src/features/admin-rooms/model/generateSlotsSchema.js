import { z } from 'zod'
import es from '@/i18n/es.js'

const t = es.adminRooms.slots.generate.errors

export const MAX_GENERATE_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const day = z.string().min(1, t.required)
const time = z.string().min(1, t.required).regex(TIME_RE, t.invalidTime)

const local = (date, time) => new Date(`${date}T${time}`)
const offset = (date, time) => local(date, time).getTimezoneOffset()
const utcDay = (date, time) => local(date, time).toISOString().slice(0, 10)
const valid = (v) =>
  [v.date_from, v.date_to].every((d) => !Number.isNaN(local(d, v.first_start).getTime())) &&
  [v.first_start, v.last_start].every((h) => !Number.isNaN(local(v.date_from, h).getTime()))

export const generateSlotsSchema = z
  .object({ date_from: day, date_to: day, first_start: time, last_start: time })
  .refine((v) => v.date_to >= v.date_from, { path: ['date_to'], message: t.toBeforeFrom })
  .refine((v) => (Date.parse(v.date_to) - Date.parse(v.date_from)) / DAY_MS <= MAX_GENERATE_DAYS, {
    path: ['date_to'],
    message: t.tooLong,
  })
  .refine((v) => v.first_start <= v.last_start, {
    path: ['first_start'],
    message: t.firstAfterLast,
  })
  .refine(
    (v) => !valid(v) || offset(v.date_from, v.first_start) === offset(v.date_to, v.first_start),
    {
      path: ['date_to'],
      message: t.timezoneChange,
    },
  )
  .superRefine((v, ctx) => {
    if (!valid(v)) return
    for (const field of ['first_start', 'last_start']) {
      if (
        utcDay(v.date_from, v[field]) !== v.date_from ||
        utcDay(v.date_to, v[field]) !== v.date_to
      ) {
        ctx.addIssue({ code: 'custom', path: [field], message: t.otherUtcDay })
      }
    }
  })

const pad = (n) => String(n).padStart(2, '0')

export function toUtcPayload(values) {
  const utc = (time) => {
    const d = new Date(`${values.date_from}T${time}`)
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  }
  return { ...values, first_start: utc(values.first_start), last_start: utc(values.last_start) }
}
