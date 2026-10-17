// Zod schema of the login form. Messages are Spanish texts from i18n.
import { z } from 'zod'
import es from '@/i18n/es.js'

const text = es.auth.validation

export const loginSchema = z.object({
  email: z.string().trim().min(1, text.emailRequired).pipe(z.email(text.emailInvalid)),
  password: z.string().min(1, text.passwordRequired),
})
