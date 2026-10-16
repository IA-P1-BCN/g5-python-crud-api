import { http, HttpResponse } from 'msw';

export const bookingHandlers = [
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();

    // Trigger the SLOT_TAKEN error flow
    if (body.slotId === 'error-slot-taken') {
      return HttpResponse.json(
        {
          code: 'SLOT_TAKEN',
          message: 'The selected time slot is no longer available.',
        },
        { status: 409 }
      );
    }

    // Default success flow
    return HttpResponse.json(
      {
        id: `booking-${Math.random().toString(36).substring(2, 9)}`,
        slotId: body.slotId,
        clientName: body.name,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),
];