import { describe, it, expect, vi } from 'vitest'
import { api } from '@/shared/api/client.js'
import { createBooking } from './bookingApi'

vi.mock('@/shared/api/client.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

describe('createBooking', () => {
  it('sends user_id (our users.id from /users/me) with the slot and players', async () => {
    api.get.mockResolvedValue({ data: { id: 7 } })
    api.post.mockResolvedValue({ data: { id: 1, status: 'PENDING' } })

    await createBooking({ slotId: 12, players: 3 })

    expect(api.get).toHaveBeenCalledWith('/users/me')
    expect(api.post).toHaveBeenCalledWith('/bookings', { user_id: 7, time_slot_id: 12, players: 3 })
  })
})
