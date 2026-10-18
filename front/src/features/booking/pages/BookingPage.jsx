// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import Button from '@/shared/ui/Button.jsx'
import { DayPicker } from '../components/DayPicker.jsx'
import { SlotGrid } from '../components/SlotGrid.jsx'
import { useSlots } from '../hooks/useSlots.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { getUpcomingDates } from '../model/upcomingDates.js'

const CHECKOUT_PATH = '/booking/checkout'

export function BookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: room } = useRoom(slug)
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot, setRoomSlug } =
    useBookingDraftStore()

  const dates = getUpcomingDates(3)
  const activeDate = selectedDate || dates[0].dateString
  const { data: slots = [], isPending, isError } = useSlots(room?.id, activeDate)

  const handleContinue = () => {
    setRoomSlug(slug)
    navigate(CHECKOUT_PATH)
  }

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

      <Button type="button" variant="primary" disabled={!selectedSlot} onClick={handleContinue}>
        {es.booking.continue}
      </Button>
    </main>
  )
}