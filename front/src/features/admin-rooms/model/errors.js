export const DUPLICATE_SLUG_ERROR = 'DUPLICATE'

export const SLOT_ERRORS = {
  SLOT_OVERLAP: 'SLOT_OVERLAP',
  SLOT_ACTIVE_BOOKING: 'SLOT_ACTIVE_BOOKING',
}

export function getErrorCode(err) {
  return err?.response?.data?.code ?? err?.code ?? 'UNKNOWN'
}
