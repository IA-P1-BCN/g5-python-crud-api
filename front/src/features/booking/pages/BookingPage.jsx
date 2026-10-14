// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useParams } from 'react-router-dom'
import { DayPicker } from '../components/DayPicker'
import { SlotGrid } from '../components/SlotGrid'
import { useSlots } from '../hooks/useSlots'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import { bookingMessages } from '@/i18n/es/booking'

export function BookingPage() {
  const { roomId } = useParams()
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot } = useBookingDraftStore()

  const mockDates = [
    { dateString: '2026-06-01', dayOfWeek: 'Lun', dayNumber: '01' },
    { dateString: '2026-06-02', dayOfWeek: 'Mar', dayNumber: '02' },
    { dateString: '2026-06-03', dayOfWeek: 'Mié', dayNumber: '03' },
  ]

  const activeDate = selectedDate || mockDates[0].dateString
  const { data: slots = [], isLoading, isError } = useSlots(roomId, activeDate)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-heading-title">{bookingMessages.title}</h1>
      
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-text-main">{bookingMessages.selectDate}</h2>
        <DayPicker 
          selectedDate={activeDate} 
          onSelectDate={setSelectedDate} 
          dates={mockDates} 
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-text-main">Horarios</h2>
        {isLoading && <p className="text-muted">Cargando horarios...</p>}
        {isError && <p className="text-error">{bookingMessages.errors.loadFailed}</p>}
        {!isLoading && !isError && (
          <SlotGrid 
            slots={slots} 
            selectedSlot={selectedSlot} 
            onSelectSlot={setSelectedSlot} 
          />
        )}
      </section>
    </div>
  )
}
