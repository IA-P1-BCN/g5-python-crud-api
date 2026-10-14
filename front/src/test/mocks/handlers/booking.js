// MSW handlers for the booking endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const bookingHandlers = [
  http.get('/api/rooms/:roomId/slots', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || '2026-06-01'

    return HttpResponse.json([
      { id: 'slot-1', time: '10:00', state: 'past', date },
      { id: 'slot-2', time: '11:00', state: 'blocked', date },
      { id: 'slot-3', time: '12:00', state: 'free', date },
      { id: 'slot-4', time: '13:00', state: 'taken', date },
    ])
  }),
]

export default bookingHandlers
