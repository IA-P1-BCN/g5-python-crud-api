// Pure: the next days for the day picker, in LOCAL time.
// The label and the date sent to the API come from the same local day.
const pad = (n) => String(n).padStart(2, '0')

export function getUpcomingDates(days = 3, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    return {
      dateString: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      dayOfWeek: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      dayNumber: pad(d.getDate()),
    }
  })
}
