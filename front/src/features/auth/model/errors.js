// Supabase sign-in error -> Spanish text. Anything unknown gets the generic message.
import es from '@/i18n/es.js'

export function loginErrorMessage(error) {
  if (error?.code === 'invalid_credentials' || error?.message === 'Invalid login credentials') {
    return es.auth.invalidCredentials
  }
  if (error?.code === 'email_not_confirmed') return es.auth.emailNotConfirmed
  return es.auth.loginError
}
