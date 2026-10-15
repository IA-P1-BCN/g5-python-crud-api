import { describe, expect, it } from 'vitest'
import { getUpcomingDates } from './upcomingDates.js'

describe('getUpcomingDates', () => {
  it('uses the local day for the label and the API date, just after local midnight', () => {
    const justAfterMidnight = new Date(2030, 0, 1, 0, 30)

    const [today] = getUpcomingDates(3, justAfterMidnight)

    expect(today).toMatchObject({ dateString: '2030-01-01', dayNumber: '01' })
  })

  it('rolls over to the next month', () => {
    const dates = getUpcomingDates(3, new Date(2030, 0, 31, 12, 0))

    expect(dates.map((d) => d.dateString)).toEqual(['2030-01-31', '2030-02-01', '2030-02-02'])
  })
})
