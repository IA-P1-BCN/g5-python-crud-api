// The booking steps of a room: 1 day, 2 time, 3 players and the summary with "Reservar".
// Gets the room as a prop (the page loads it), keeps the choices in the booking draft store.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import es from '@/i18n/es.js'
import { formatDateTime, formatPrice } from '@/shared/lib/format.js'
import Button from '@/shared/ui/Button.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { useSlots } from '../hooks/useSlots.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { computeTotalPrice } from '../model/price.js'
import { getUpcomingDates } from '../model/upcomingDates.js'
import { DayPicker } from './DayPicker.jsx'
import { PlayersDial } from './PlayersDial.jsx'
import { SlotGrid } from './SlotGrid.jsx'

const CHECKOUT_PATH = '/booking/checkout'
const DAYS = 5
const t = es.booking

function Step({ number, title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-text flex items-center gap-3 text-lg font-semibold">
        <b className="bg-room text-on-room rounded-pill grid size-7 place-items-center font-mono text-sm">
          {number}
        </b>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Booker({ room }) {
  const navigate = useNavigate()
  const { selectedDate, selectedSlot, players, setSelectedDate, setSelectedSlot, setPlayers } =
    useBookingDraftStore()

  // A draft made in another room must not leak into this one; players stay inside the room range.
  useEffect(() => {
    const draft = useBookingDraftStore.getState()
    draft.startRoom(room.slug)
    const inRange = Math.min(room.maxPlayers, Math.max(room.minPlayers, draft.players))
    if (inRange !== draft.players) draft.setPlayers(inRange)
  }, [room.slug, room.minPlayers, room.maxPlayers])

  const dates = getUpcomingDates(DAYS)
  const activeDate = selectedDate || dates[0].dateString
  const { data: slots = [], isLoading, isError } = useSlots(room.id, activeDate)

  // Only a slot that is on screen can be booked.
  const canContinue = slots.some((slot) => slot.id === selectedSlot?.id)
  const shownPlayers = Math.min(room.maxPlayers, Math.max(room.minPlayers, players))
  const total = computeTotalPrice({ pricePerPlayer: room.pricePerPlayer, players: shownPlayers })

  return (
    <div className="space-y-8">
      <Step number={1} title={t.selectDay}>
        <DayPicker selectedDate={activeDate} onSelectDate={setSelectedDate} dates={dates} />
      </Step>

      <Step number={2} title={t.selectTime}>
        {isLoading && <Spinner label={t.loadingSlots} />}
        {isError && <p className="text-error">{t.errors.loadFailed}</p>}
        {!isLoading && !isError && (
          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
        )}
      </Step>

      <Step number={3} title={t.selectPlayers}>
        <PlayersDial
          value={shownPlayers}
          min={room.minPlayers}
          max={room.maxPlayers}
          onChange={setPlayers}
        />
        <p className="text-muted text-sm">{t.playersRange(room.minPlayers, room.maxPlayers)}</p>
      </Step>

      <div className="bg-surface border-line sticky bottom-0 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <p className="text-muted">
            {canContinue ? formatDateTime(selectedSlot.startsAt) : t.summary.noSlot}
          </p>
          <p className="text-exit font-mono text-2xl">{formatPrice(total)}</p>
          <p className="text-muted text-sm">
            {t.summary.perPlayers(formatPrice(room.pricePerPlayer), shownPlayers)}
          </p>
        </div>
        <Button type="button" disabled={!canContinue} onClick={() => navigate(CHECKOUT_PATH)}>
          {t.continue}
        </Button>
      </div>
    </div>
  )
}
