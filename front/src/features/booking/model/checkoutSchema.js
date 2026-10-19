import { z } from 'zod'
import es from '@/i18n/es.js'

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, es.booking.errors.nameRequired)
    .max(100, es.booking.errors.nameTooLong),
  email: z
    .string()
    .trim()
    .min(1, es.booking.errors.emailInvalid)
    .pipe(z.email(es.booking.errors.emailInvalid)),
  phone: z
    .string()
    .trim()
    .max(50, es.booking.errors.phoneInvalid)
    .regex(/^[+\d\s().-]*$/, es.booking.errors.phoneInvalid),
})
