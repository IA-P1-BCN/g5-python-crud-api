import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBooking } from '../api/bookingApi'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import { useCreateBooking } from './useCreateBooking'

vi.mock('../api/bookingApi', () => ({ createBooking: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  createBooking.mockResolvedValue({ id: 99 })
  useBookingDraftStore.getState().resetDraft()
})

describe('useCreateBooking', () => {
  it('sends the explicit slotId and players, not the stale draft values', async () => {
    useBookingDraftStore.getState().setPlayers(1)
    const { result } = renderHook(() => useCreateBooking())

    await act(async () => {
      await result.current.submitBooking({ slotId: 5, players: 4 })
    })

    expect(createBooking).toHaveBeenCalledWith({ slotId: 5, players: 4 })
  })

  it('falls back to the current draft when called without arguments', async () => {
    useBookingDraftStore.getState().setSlotId(8)
    useBookingDraftStore.getState().setPlayers(3)
    const { result } = renderHook(() => useCreateBooking())

    await act(async () => {
      await result.current.submitBooking()
    })

    expect(createBooking).toHaveBeenCalledWith({ slotId: 8, players: 3 })
  })
})
