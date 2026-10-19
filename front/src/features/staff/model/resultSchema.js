import { z } from 'zod'
import es from '@/i18n/es.js'

export const resultSchema = z.object({
  completed: z.boolean(),
  completion_time: z
    .string()
    .trim()
    .min(1, es.staff.timeRequired)
    .pipe(
      z.coerce.number(es.staff.timeInvalid).int(es.staff.timeInvalid).min(0, es.staff.timeInvalid),
    ),
})
