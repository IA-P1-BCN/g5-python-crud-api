import { z } from 'zod'
import es from '@/i18n/es.js'

export const profileSchema = z.object({
  name: z.string().trim().min(1, es.profile.nameRequired).max(100, es.profile.nameTooLong),
  phone: z.string().trim().max(50, es.profile.phoneTooLong),
})
