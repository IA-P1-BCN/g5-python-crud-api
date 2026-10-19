import { describe, it, expect, vi } from 'vitest'
import { api } from '@/shared/api/client.js'
import { createBooking } from './bookingApi'

vi.mock('@/shared/api/client.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

describe('createBooking', () => {
  it('posts user_id, time_slot_id and players without calling /users/me', async () => {
    api.post.mockResolvedValue({ data: { id: 1, status: 'PENDING' } })

    const result = await createBooking({ userId: 7, slotId: 12, players: 3 })

    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledWith('/bookings', { user_id: 7, time_slot_id: 12, players: 3 })
    expect(result).toEqual({ id: 1, status: 'PENDING' })
  })
})
