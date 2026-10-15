// MSW handlers for the booking endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const bookingHandlers = [
  http.get('/api/v1/time-slots', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || '2026-06-01'

    return HttpResponse.json({
      items: [
        { id: 'slot-1', starts_at: `${date}T10:00:00Z`, state: 'past' },
        { id: 'slot-2', starts_at: `${date}T11:00:00Z`, state: 'blocked' },
        { id: 'slot-3', starts_at: `${date}T12:00:00Z`, state: 'taken' },
        { id: 'slot-4', starts_at: `${date}T13:00:00Z`, state: 'free' },
      ],
      total: 4,
      page: 1,
      size: 20,
    })
  }),
]

export default bookingHandlers
