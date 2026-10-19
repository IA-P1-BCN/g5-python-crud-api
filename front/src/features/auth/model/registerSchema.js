import { z } from 'zod'
import es from '@/i18n/es.js'

const common = es.auth.validation
const text = es.auth.register.validation

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, text.nameRequired).max(100, text.nameTooLong),
    email: z.string().trim().min(1, common.emailRequired).pipe(z.email(common.emailInvalid)),
    password: z.string().min(1, common.passwordRequired).min(8, text.passwordMin),
    confirmPassword: z.string().min(1, text.confirmRequired),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: text.passwordsMismatch,
  })
