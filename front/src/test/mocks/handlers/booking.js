// MSW handlers for the booking endpoints (see docs/API_CONTRACT.md). One file per feature: no conflicts.
import { http, HttpResponse } from 'msw'

export const bookingHandlers = [
  http.get('/api/v1/time-slots', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || '2026-06-01'

    return HttpResponse.json({
      items: [
        { id: 'slot-1', starts_at: `${date}T10:00:00Z`, is_bookable: false },
        { id: 'slot-2', starts_at: `${date}T11:00:00Z`, is_bookable: true },
      ],
      total: 2,
      page: 1,
      size: 20,
    })
  }),
]

export default bookingHandlers
