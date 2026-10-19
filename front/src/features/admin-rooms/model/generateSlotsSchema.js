import { z } from 'zod'
import es from '@/i18n/es.js'

const t = es.adminRooms.slots.generate.errors

// Same limit as the API (BR-S8): at most 90 days between date_from and date_to.
export const MAX_GENERATE_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const day = z.string().min(1, t.required)
const time = z.string().min(1, t.required).regex(TIME_RE, t.invalidTime)

// Field names are the ones the API expects (POST /rooms/{id}/time-slots/generate).
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
