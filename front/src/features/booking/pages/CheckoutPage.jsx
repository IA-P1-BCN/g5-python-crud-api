// Route page: recap and submit. React Hook Form + Zod. Shows SLOT_TAKEN near the submit button.
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import es from '@/i18n/es.js'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { PlayersDial } from '../components/PlayersDial.jsx'
import { Ticket } from '../components/Ticket.jsx'
import { checkoutSchema } from '../model/checkoutSchema.js'

const t = es.booking.checkout

export function CheckoutPage({ room, onSubmit }) {
  const [players, setPlayers] = useState(room.minPlayers)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: '', email: '', phone: '' },
  })

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
      <form
        noValidate
        onSubmit={handleSubmit((data) => onSubmit({ ...data, players }))}
        className="space-y-4"
      >
        <Field label={t.name} error={errors.name?.message} {...register('name')} />
        <Field label={t.email} type="email" error={errors.email?.message} {...register('email')} />
        <Field label={t.phone} type="tel" error={errors.phone?.message} {...register('phone')} />
        <Button type="submit">{t.submit}</Button>
      </form>
    </main>
  )
}
