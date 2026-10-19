import es from '@/i18n/es.js'

export function loginErrorMessage(error) {
  if (error?.code === 'invalid_credentials' || error?.message === 'Invalid login credentials') {
    return es.auth.invalidCredentials
  }
  if (error?.code === 'email_not_confirmed') return es.auth.emailNotConfirmed
  return es.auth.loginError
}

export function registerErrorMessage(error) {
  const code = error?.response?.data?.code ?? error?.code
  if (
    code === 'user_already_exists' ||
    code === 'DUPLICATE' ||
    /already registered/i.test(error?.message ?? '')
  ) {
    return es.auth.register.duplicate
  }
  if (code === 'weak_password') return es.auth.register.weakPassword
  return es.auth.register.error
}
