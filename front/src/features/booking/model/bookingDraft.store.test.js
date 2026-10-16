import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingDraftStore } from './bookingDraft.store';

describe('bookingDraft.store', () => {
  // Clear the store before each test to ensure test isolation
  beforeEach(() => {
    useBookingDraftStore.getState().resetDraft();
  });

  it('should initialize with default state', () => {
    const state = useBookingDraftStore.getState();
    expect(state.slotId).toBeNull();
    expect(state.clientDetails).toEqual({ name: '', email: '', phone: '' });
    expect(state.currentStep).toBe(1);
  });

  it('survives step changes while retaining draft data (Acceptance Criterion)', () => {
    // Step 1: Select a slot
    useBookingDraftStore.getState().setSlotId('slot-abc-123');
    
    // Move to Step 2
    useBookingDraftStore.getState().setStep(2);
    
    // Verify data survived the step change
    const state = useBookingDraftStore.getState();
    expect(state.currentStep).toBe(2);
    expect(state.slotId).toBe('slot-abc-123');
  });

  it('should update client details partially without overwriting existing fields', () => {
    useBookingDraftStore.getState().setClientDetails({ name: 'Isbel' });
    useBookingDraftStore.getState().setClientDetails({ email: 'test@example.com' });

    const state = useBookingDraftStore.getState();
    expect(state.clientDetails).toEqual({
      name: 'Isbel',
      email: 'test@example.com',
      phone: '',
    });
  });

  it('should reset the draft completely', () => {
    useBookingDraftStore.getState().setSlotId('slot-999');
    useBookingDraftStore.getState().setStep(3);
    useBookingDraftStore.getState().resetDraft();

    const state = useBookingDraftStore.getState();
    expect(state.slotId).toBeNull();
    expect(state.currentStep).toBe(1);
  });
});