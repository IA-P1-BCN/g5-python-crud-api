import { describe, expect, it } from 'vitest'
import { api } from './client.js'

describe('api client', () => {
  it('uses the relative /api/v1 base URL (same origin, no CORS)', () => {
    expect(api.defaults.baseURL).toBe('/api/v1')
  })
})
