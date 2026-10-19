import es from '@/i18n/es.js'

export function mapApiError(error, featureCodes = {}) {
  const code = error?.response?.data?.code ?? null
  const isNetworkError = error?.isAxiosError && !error.response
  const message = isNetworkError
    ? es.common.errors.NETWORK_ERROR
    : (featureCodes[code] ?? es.common.errors[code] ?? es.common.errors.unknown)
  return { code, message }
}
