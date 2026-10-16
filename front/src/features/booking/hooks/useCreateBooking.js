import { useState } from 'react';
import { createBooking } from '../api/bookingApi';
import { useBookingDraftStore } from '../model/bookingDraft.store';
import { SlotTakenError } from '../model/errors';

export function useCreateBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Access state safely without subscribing the hook to everything
  const draftStore = useBookingDraftStore();

  const submitBooking = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        slotId: draftStore.slotId,
        ...draftStore.clientDetails,
      };
      
      const result = await createBooking(payload);
      
      // On success, clear the draft
      draftStore.resetDraft();
      
      return { success: true, data: result };
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setError('SLOT_TAKEN');
        // Draft is intentionally NOT reset here so the user doesn't lose their form data
      } else {
        setError('UNEXPECTED_ERROR');
      }
      
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBooking,
    isSubmitting,
    error,
    resetError: () => setError(null),
  };
}