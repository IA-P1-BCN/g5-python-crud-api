// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useParams } from 'react-router-dom'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import { DayPicker } from '../components/DayPicker.jsx'
import { SlotGrid } from '../components/SlotGrid.jsx'
import { useSlots } from '../hooks/useSlots.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'

const getUpcomingDates = (days = 3) =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      dateString: d.toISOString().split('T')[0],
      dayOfWeek: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      dayNumber: d.getDate().toString().padStart(2, '0'),
    }
  })

export function BookingPage() {
  const { slug } = useParams()
  const { data: room } = useRoom(slug)
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot } = useBookingDraftStore()

  const dates = getUpcomingDates(3)
  const activeDate = selectedDate || dates[0].dateString
  const { data: slots = [], isPending, isError } = useSlots(room?.id, activeDate)

  return (
    <main data-room={slug} className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="heading-title">{es.booking.title}</h1>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{es.booking.selectDate}</h2>
        <DayPicker selectedDate={activeDate} onSelectDate={setSelectedDate} dates={dates} />
      </section>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{es.booking.selectTime}</h2>
        {isPending && <p className="text-muted">{es.booking.loadingSlots}</p>}
        {isError && <p className="text-error">{es.booking.errors.loadFailed}</p>}
        {!isPending && !isError && (
          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
        )}
      </section>
    </main>
  )
}
