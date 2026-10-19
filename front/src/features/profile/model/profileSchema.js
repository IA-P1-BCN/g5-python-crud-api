// Zod schema for the profile form (BR-U2). Messages come from i18n.
import { z } from 'zod'
import es from '@/i18n/es.js'

export const profileSchema = z.object({
  // trim() first: "   " must count as empty, not as a valid name.
  name: z.string().trim().min(1, es.profile.nameRequired).max(100, es.profile.nameTooLong),
  // Optional: an empty field is fine. 50 = the API limit (schemas/user.py).
  phone: z.string().trim().max(50, es.profile.phoneTooLong),
})
