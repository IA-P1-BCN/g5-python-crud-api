import { SlotTakenError } from '../model/errors';

export async function createBooking(bookingData) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Map backend 409 Conflict to our specific domain error
    if (response.status === 409 || errorData.code === 'SLOT_TAKEN') {
      throw new SlotTakenError();
    }
    
    throw new Error(errorData.message || 'Failed to create booking');
  }

  return response.json();
}