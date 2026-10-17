import { useNavigate } from 'react-router-dom'
import Button from '@/shared/ui/Button.jsx'
import texts from '@/i18n/es/booking'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useBookingDraftStore } from '../model/bookingDraft.store'

const CONFIRMATION_PATH = '/booking/confirmation'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { submitBooking, isSubmitting, error } = useCreateBooking()
  const { clientDetails, slotId } = useBookingDraftStore()

  const t = texts.checkout
  const errorText = { SLOT_TAKEN: t.errors.slotTaken, UNEXPECTED_ERROR: t.errors.unexpected }[error]

  const handleConfirm = async () => {
    if (!slotId) return

    const result = await submitBooking()

    if (result.success) {
      navigate(CONFIRMATION_PATH, {
        state: {
          booking: { ...result.data, slotId, clientName: clientDetails.name },
        },
      })
    }
  }

  return (
    <div className="bg-surface-2 border-line mx-auto max-w-md rounded-lg border p-6">
      <h2 className="text-text mb-6 text-2xl font-bold">{t.title}</h2>

      <div className="text-text mb-6 space-y-2">
        <p>
          <span className="font-semibold">{t.name}:</span> {clientDetails.name || t.unspecified}
        </p>
        <p>
          <span className="font-semibold">{t.email}:</span> {clientDetails.email || t.unspecified}
        </p>
        <p>
          <span className="font-semibold">{t.phone}:</span> {clientDetails.phone || t.unspecified}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {errorText && (
          <div className="border-line text-error rounded-md border p-3 text-sm" role="alert">
            {errorText}
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={isSubmitting || !slotId}
        >
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </div>
    </div>
  )
}
export default CheckoutPage
