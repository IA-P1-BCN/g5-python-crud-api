import es from '@/i18n/es.js'

export function mapApiError(error, featureCodes = {}) {
  const code = error?.response?.data?.code ?? null
  const message = error?.response
    ? (featureCodes[code] ?? es.common.errors[code] ?? es.common.errors.unknown)
    : es.common.errors.NETWORK_ERROR
  return { code, message }
}
