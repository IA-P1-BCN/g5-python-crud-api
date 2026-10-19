import { useState } from 'react'
import { createBooking } from '../api/bookingApi'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import { SlotTakenError } from '../model/errors'

export function useCreateBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const resetDraft = useBookingDraftStore((state) => state.resetDraft)

  // Los valores explícitos mandan; el store solo es respaldo.
  // getState() lee el valor actual, no el capturado en el último render.
  const submitBooking = async (overrides = {}) => {
    const draft = useBookingDraftStore.getState()
    const slotId = overrides.slotId ?? draft.slotId
    const players = overrides.players ?? draft.players

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createBooking({ slotId, players })

      resetDraft()

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