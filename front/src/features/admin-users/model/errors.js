// Maps an API error to a Spanish message through its `code` (API_CONTRACT: error codes).
import es from '@/i18n/es.js'

export function userErrorMessage(error) {
  const code = error?.response?.data?.code
  return es.adminUsers.errors[code] ?? es.common.errors[code] ?? es.adminUsers.errors.unknown
}
