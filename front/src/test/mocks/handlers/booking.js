import { http, HttpResponse } from 'msw'

export const bookingHandlers = [
  http.get('*/users/me', () => HttpResponse.json({ id: 7, role: 'client' })),

  http.post('*/bookings', async ({ request }) => {
    const body = await request.clone().json()

    if (body.time_slot_id === 'error-slot-taken') {
      return HttpResponse.json(
        { detail: 'The selected time slot is no longer available.', code: 'SLOT_TAKEN' },
        { status: 409 },
      )
    }

    return HttpResponse.json(
      {
        id: 'booking-1',
        time_slot_id: body.time_slot_id,
        players: body.players,
        status: 'PENDING',
      },
      { status: 201 },
    )
  }),
]

export default bookingHandlers
