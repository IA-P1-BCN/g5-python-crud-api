import { describe, it, expect } from 'vitest'
import es from '@/i18n/es.js'
import { mapApiError } from './errors.js'

const apiError = (code) => ({ response: { data: { detail: 'x', code } } })

describe('mapApiError', () => {
  it('maps a generic backend code to its common message', () => {
    expect(mapApiError(apiError('FORBIDDEN'))).toEqual({
      code: 'FORBIDDEN',
      message: es.common.errors.FORBIDDEN,
    })
  })

  it('uses the feature message for a feature code', () => {
    const featureCodes = { INVALID_TRANSITION: 'Ya cambió de estado' }
    expect(mapApiError(apiError('INVALID_TRANSITION'), featureCodes)).toEqual({
      code: 'INVALID_TRANSITION',
      message: 'Ya cambió de estado',
    })
  })

  it('lets a feature code win over a generic one', () => {
    const featureCodes = { FORBIDDEN: 'Solo el admin' }
    expect(mapApiError(apiError('FORBIDDEN'), featureCodes).message).toBe('Solo el admin')
  })

  it.each([
    'BOOKING_LIMIT_REACHED',
    'ROOM_HAS_BOOKINGS',
    'LAST_ADMIN',
    'ROOM_INACTIVE',
    'USER_INACTIVE',
    'INVALID_PLAYERS',
    'SLOT_OVERLAP',
    'AUTH_UNAVAILABLE',
    'METHOD_NOT_ALLOWED',
    'HTTP_ERROR',
  ])('maps %s to its common Spanish message', (code) => {
    expect(mapApiError(apiError(code))).toEqual({
      code,
      message: es.common.errors[code],
    })
  })

  it('unknown code → generic message, code kept', () => {
    expect(mapApiError(apiError('SOMETHING_NEW'))).toEqual({
      code: 'SOMETHING_NEW',
      message: es.common.errors.unknown,
    })
  })

  it('no response (network down) → network message, no code', () => {
    expect(mapApiError(new Error('Network Error'))).toEqual({
      code: null,
      message: es.common.errors.NETWORK_ERROR,
    })
  })
})
