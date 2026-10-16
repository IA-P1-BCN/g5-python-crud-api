import { useNavigate } from 'react-router-dom';
import { useCreateBooking } from '../hooks/useCreateBooking';
import { useBookingDraftStore } from '../model/bookingDraft.store';
import texts from '@/i18n/es/booking';
import Toast from '@/shared/ui/Toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { submitBooking, isSubmitting, error } = useCreateBooking();
  const { clientDetails, slotId } = useBookingDraftStore();
  
  const t = texts.checkout;

  const handleConfirm = async () => {
    if (!slotId) return;

    const result = await submitBooking();
    
    if (result.success) {
      navigate('/booking/confirmation', { state: { booking: result.data } });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{t.title}</h2>
      
      <div className="mb-6 space-y-2">
        <p><span className="font-semibold">{t.name}:</span> {clientDetails.name || t.unspecified}</p>
        <p><span className="font-semibold">{t.email}:</span> {clientDetails.email || t.unspecified}</p>
        <p><span className="font-semibold">{t.phone}:</span> {clientDetails.phone || t.unspecified}</p>
      </div>

      <div className="flex flex-col gap-4">
        {error === 'SLOT_TAKEN' && (
          <Toast tone="error">{t.errors.slotTaken}</Toast>
        )}
        
        {error === 'UNEXPECTED_ERROR' && (
          <Toast tone="error">{t.errors.unexpected}</Toast>
        )}

        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !slotId}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}