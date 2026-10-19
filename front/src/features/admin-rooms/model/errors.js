export function getErrorCode(err) {
  return err?.response?.data?.code ?? err?.code ?? 'UNKNOWN'
}
