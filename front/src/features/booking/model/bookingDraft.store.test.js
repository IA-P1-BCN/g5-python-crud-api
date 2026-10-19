import { describe, it, expect, beforeEach } from 'vitest'
import { useBookingDraftStore } from './bookingDraft.store'

describe('bookingDraft.store', () => {
  beforeEach(() => {
    useBookingDraftStore.getState().resetDraft()
  })

  it('should initialize with default state', () => {
    const state = useBookingDraftStore.getState()
    expect(state.slotId).toBeNull()
    expect(state.currentStep).toBe(1)
  })

  it('survives step changes while retaining draft data (Acceptance Criterion)', () => {
    useBookingDraftStore.getState().setSlotId('slot-abc-123')

    useBookingDraftStore.getState().setStep(2)

    const state = useBookingDraftStore.getState()
    expect(state.currentStep).toBe(2)
    expect(state.slotId).toBe('slot-abc-123')
  })

  it('should reset the draft completely', () => {
    useBookingDraftStore.getState().setSlotId('slot-999')
    useBookingDraftStore.getState().setStep(3)
    useBookingDraftStore.getState().resetDraft()

    const state = useBookingDraftStore.getState()
    expect(state.slotId).toBeNull()
    expect(state.currentStep).toBe(1)
  })

  it('keeps the draft when the same room is opened again', () => {
    useBookingDraftStore.getState().startRoom('faro')
    useBookingDraftStore.getState().setSelectedSlot({ id: 1 })
    useBookingDraftStore.getState().startRoom('faro')

    expect(useBookingDraftStore.getState().selectedSlot).toEqual({ id: 1 })
  })

  it('resets the slot and the day when another room is opened', () => {
    useBookingDraftStore.getState().startRoom('faro')
    useBookingDraftStore.getState().setSelectedDate('2030-01-01')
    useBookingDraftStore.getState().setSelectedSlot({ id: 1 })
    useBookingDraftStore.getState().startRoom('mansion')

    const state = useBookingDraftStore.getState()
    expect(state.roomSlug).toBe('mansion')
    expect(state.selectedSlot).toBeNull()
    expect(state.slotId).toBeNull()
    expect(state.selectedDate).toBeNull()
  })
})
