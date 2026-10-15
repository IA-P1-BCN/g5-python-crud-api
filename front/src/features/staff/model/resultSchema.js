import { z } from 'zod'
import es from '@/i18n/es.js'

export const resultSchema = z.object({
  completed: z.boolean(),
  // An <input type="number"> gives text. We check it is not empty first,
  // because z.coerce.number() would turn '' into 0 without complaining.
  completion_time: z
    .string()
    .trim()
    .min(1, es.staff.timeRequired)
    .pipe(
      z.coerce.number(es.staff.timeInvalid).int(es.staff.timeInvalid).min(0, es.staff.timeInvalid),
    ),
})
