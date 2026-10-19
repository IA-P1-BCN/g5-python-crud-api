import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { meQueryKey } from '@/features/auth'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import { PlayersDial } from '../components/PlayersDial.jsx'
import { Ticket } from '../components/Ticket.jsx'
import { useCreateBooking } from '../hooks/useCreateBooking.js'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'

const t = es.booking.checkout
const CONFIRMATION_PATH = '/booking/confirmation'

export function CheckoutPage() {
  const { slotId, selectedSlot, roomSlug, players: draftPlayers } = useBookingDraftStore()
  const { data: room, isLoading, error: roomError } = useRoom(roomSlug)

  if (!slotId) return <Navigate to={roomSlug ? `/reservar/${roomSlug}` : '/salas'} replace />

  if (isLoading)
    return (
      <main className="p-6">
        <Spinner label={es.common.loading} />
      </main>
    )

  if (roomError || !room)
    return (
      <main className="p-6">
        <Alert tone="error">{es.booking.errors.loadRoomFailed}</Alert>
      </main>
    )

  return (
    <CheckoutForm
      key={room.id}
      room={room}
      slotId={slotId}
      startsAt={selectedSlot?.startsAt}
      draftPlayers={draftPlayers}
    />
  )
}

function CheckoutForm({ room, slotId, startsAt, draftPlayers }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { submitBooking, isSubmitting, error } = useCreateBooking()
  const [players, setPlayers] = useState(
    Math.min(room.maxPlayers, Math.max(room.minPlayers, draftPlayers)),
  )

  const onSubmit = async (event) => {
    event.preventDefault()
    const result = await submitBooking({ slotId, players })

    if (result.success) {
      const clientName = queryClient.getQueryData(meQueryKey)?.name
      navigate(CONFIRMATION_PATH, {
        state: { booking: { ...result.data, startsAt, clientName } },
      })
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="heading-title">{t.title}</h1>

      <fieldset className="space-y-2">
        <legend className="text-text text-lg font-semibold">{t.players}</legend>
        <PlayersDial
          value={players}
          min={room.minPlayers}
          max={room.maxPlayers}
          onChange={setPlayers}
        />
      </fieldset>

      <Ticket
        roomName={room.name}
        startsAt={startsAt}
        players={players}
        pricePerPlayer={room.pricePerPlayer}
      />

      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </form>
    </main>
  )
}

export default CheckoutPage
