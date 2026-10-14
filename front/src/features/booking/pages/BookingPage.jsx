// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useParams } from 'react-router-dom'
import { DayPicker } from '../components/DayPicker'
import { SlotGrid } from '../components/SlotGrid'
import { useSlots } from '../hooks/useSlots'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import { bookingMessages } from '@/i18n/es/booking'

const getUpcomingDates = (days = 3) => {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      dateString: d.toISOString().split('T')[0],
      dayOfWeek: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      dayNumber: d.getDate().toString().padStart(2, '0'),
    }
  })
}

export function BookingPage() {
  const { roomId } = useParams()
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot } = useBookingDraftStore()

  const mockDates = getUpcomingDates(3)

  const activeDate = selectedDate || mockDates[0].dateString
  const { data: slots = [], isLoading, isError } = useSlots(roomId, activeDate)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-heading-title text-2xl font-bold">{bookingMessages.title}</h1>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{bookingMessages.selectDate}</h2>
        <DayPicker selectedDate={activeDate} onSelectDate={setSelectedDate} dates={mockDates} />
      </section>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{bookingMessages.selectTime}</h2>
        {isLoading && <p className="text-muted">{bookingMessages.loadingSlots}</p>}
        {isError && <p className="text-error">{bookingMessages.errors.loadFailed}</p>}
        {!isLoading && !isError && (
          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
        )}
      </section>
    </div>
  )
}
