// Route page: choose day, slot and players. Uses useSlots + draft store.
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { DayPicker } from '../components/DayPicker.jsx'
import { SlotGrid } from '../components/SlotGrid.jsx'
import { useSlots } from '../hooks/useSlots.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { getUpcomingDates } from '../model/upcomingDates.js'

const CHECKOUT_PATH = '/booking/checkout'

export function BookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: room, isLoading: roomLoading, error: roomError } = useRoom(slug)
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot, startRoom } =
    useBookingDraftStore()

  // A draft made in another room must not leak into this one.
  useEffect(() => {
    startRoom(slug)
  }, [slug, startRoom])

  const dates = getUpcomingDates(3)
  const activeDate = selectedDate || dates[0].dateString
  const { data: slots = [], isLoading, isError } = useSlots(room?.id, activeDate)

  // Only a slot that is on screen can be booked.
  const canContinue = slots.some((slot) => slot.id === selectedSlot?.id)

  const handleContinue = () => navigate(CHECKOUT_PATH)

  if (roomLoading)
    return (
      <main className="p-6">
        <Spinner label={es.booking.loadingSlots} />
      </main>
    )

  if (roomError?.response?.status === 404 || (room && !room.isActive))
    return (
      <main className="p-6">
        <EmptyState title={es.booking.roomNotFound} />
      </main>
    )

  if (roomError)
    return (
      <main className="p-6">
        <Alert tone="error">{es.booking.errors.loadRoomFailed}</Alert>
      </main>
    )

  return (
    <main data-room={slug} className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="heading-title">{es.booking.title}</h1>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{es.booking.selectDate}</h2>
        <DayPicker selectedDate={activeDate} onSelectDate={setSelectedDate} dates={dates} />
      </section>

      <section className="space-y-2">
        <h2 className="text-text text-lg font-semibold">{es.booking.selectTime}</h2>
        {isLoading && <Spinner label={es.booking.loadingSlots} />}
        {isError && <p className="text-error">{es.booking.errors.loadFailed}</p>}
        {!isLoading && !isError && (
          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
        )}
      </section>

      <Button type="button" variant="primary" disabled={!canContinue} onClick={handleContinue}>
        {es.booking.continue}
      </Button>
    </main>
  )
}
