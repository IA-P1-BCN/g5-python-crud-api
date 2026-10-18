// Route page: recap and submit. React Hook Form + Zod. Shows SLOT_TAKEN near the submit button.
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '@/features/rooms'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { PlayersDial } from '../components/PlayersDial.jsx'
import { Ticket } from '../components/Ticket.jsx'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useBookingDraftStore } from '../model/bookingDraft.store.js'
import { checkoutSchema } from '../model/checkoutSchema.js'

const t = es.booking.checkout
const CONFIRMATION_PATH = '/booking/confirmation'

// Respaldo cuando no hay sala (p. ej. si se recarga la página: el store vive en memoria)
const DEFAULT_ROOM = { name: '', minPlayers: 1, maxPlayers: 6, pricePerPlayer: 0 }

export function CheckoutPage() {
  const navigate = useNavigate()
  const { submitBooking, isSubmitting, error } = useCreateBooking()
  const {
    clientDetails,
    slotId,
    roomSlug,
    setClientDetails,
    setPlayers: saveDraftPlayers,
  } = useBookingDraftStore()
  const { data: room = DEFAULT_ROOM } = useRoom(roomSlug)
  const [players, setPlayers] = useState(room.minPlayers)

  const errorText = { SLOT_TAKEN: t.errors.slotTaken, UNEXPECTED_ERROR: t.errors.unexpected }[error]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: clientDetails.name,
      email: clientDetails.email,
      phone: clientDetails.phone,
    },
  })

  const onSubmit = async (data) => {
    if (!slotId) return

    // ASUMIDO: submitBooking() lee del store, así que lo rellenamos antes de enviar
    setClientDetails(data)
    saveDraftPlayers(players)

    const result = await submitBooking()

    if (result.success) {
      navigate(CONFIRMATION_PATH, {
        state: { booking: { ...result.data, slotId, clientName: data.name } },
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

      <Ticket roomName={room.name} players={players} pricePerPlayer={room.pricePerPlayer} />

      {/* noValidate: Zod gives the messages, not the browser bubble. */}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.name} error={errors.name?.message} {...register('name')} />
        <Field label={t.email} type="email" error={errors.email?.message} {...register('email')} />
        <Field label={t.phone} type="tel" error={errors.phone?.message} {...register('phone')} />

        {errorText && <Alert tone="error">{errorText}</Alert>}

        <Button type="submit" disabled={isSubmitting || !slotId}>
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </form>
    </main>
  )
}

export default CheckoutPage