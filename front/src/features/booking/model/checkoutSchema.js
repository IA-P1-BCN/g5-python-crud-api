// Zod schema for the checkout form (name, email, phone). Same limits as the API (BR-U1, BR-U2).
import { z } from 'zod'
import es from '@/i18n/es.js'

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, es.booking.errors.nameRequired)
    .max(100, es.booking.errors.nameTooLong),
  // pipe: if the text is empty, we stop there and give ONE error instead of two.
  email: z
    .string()
    .trim()
    .min(1, es.booking.errors.emailInvalid)
    .pipe(z.email(es.booking.errors.emailInvalid)),
  // Optional: an empty string is valid (the regex allows zero characters).
  phone: z
    .string()
    .trim()
    .max(50, es.booking.errors.phoneInvalid)
    .regex(/^[+\d\s().-]*$/, es.booking.errors.phoneInvalid),
})
