import { useState } from 'react'
import { createBooking } from '../api/bookingApi'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import { SlotTakenError } from '../model/errors'

export function useCreateBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const draftStore = useBookingDraftStore()

  const submitBooking = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createBooking({
        slotId: draftStore.slotId,
        players: draftStore.players,
      })

      draftStore.resetDraft()

      return { success: true, data: result }
    } catch (err) {
      // El borrador NO se reinicia: el usuario no pierde sus datos
      setError(err instanceof SlotTakenError ? 'SLOT_TAKEN' : 'UNEXPECTED_ERROR')
      return { success: false, error: err }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    submitBooking,
    isSubmitting,
    error,
    resetError: () => setError(null),
  }
}
