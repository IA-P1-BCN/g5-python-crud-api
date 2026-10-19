// Next step of a booking, depending on its status: one button (confirm / start / finish)
// or the result form. Calls the mutation and shows the API error (INVALID_TRANSITION...).
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import { useState } from 'react'
import { useConfirmBooking } from '../hooks/useConfirmBooking.js'
import { useFinishGame } from '../hooks/useFinishGame.js'
import { useStartGame } from '../hooks/useStartGame.js'
import { staffErrorCodes } from '../model/errors.js'
import { allowedActions } from '../model/gameTransitions.js'
import ResultForm from './ResultForm.jsx'

// Same rule as the API (BR-G3): the UTC day of the slot must be today's.
const isGameDay = (booking) =>
  booking.time_slot.starts_at.slice(0, 10) === new Date().toISOString().slice(0, 10)

export default function GameActions({ booking }) {
  // One mutation per button. Hooks must always be called, so they stay above any early return.
  const mutations = {
    confirm: useConfirmBooking(),
    start: useStartGame(),
    finish: useFinishGame(),
  }

  const [wrongDay, setWrongDay] = useState(false)

  const [action] = allowedActions(booking)
  if (action === 'register_result') return <ResultForm booking={booking} />
  if (!action) return null

  const mutation = mutations[action]

  // Starting is only allowed on the day of the game: say it without calling the API.
  const handleClick = (m) => {
    const blocked = action === 'start' && !isGameDay(booking)
    setWrongDay(blocked)
    if (!blocked) m.mutate(booking.id)
  }

  return (
    <div>
      <Button loading={mutation.isPending} onClick={() => handleClick(mutation)}>
        {es.staff.actions[action]}
      </Button>
      {wrongDay && <Alert tone="error">{es.staff.errors.NOT_GAME_DAY}</Alert>}
      {!wrongDay && mutation.isError && (
        <Alert tone="error">{mapApiError(mutation.error, staffErrorCodes).message}</Alert>
      )}
    </div>
  )
}
