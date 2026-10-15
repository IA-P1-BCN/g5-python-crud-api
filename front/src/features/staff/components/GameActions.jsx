// Next step of a booking, depending on its status: one button (confirm / start / finish)
// or the result form. Calls the mutation and shows the API error (INVALID_TRANSITION...).
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import { useConfirmBooking } from '../hooks/useConfirmBooking.js'
import { useFinishGame } from '../hooks/useFinishGame.js'
import { useStartGame } from '../hooks/useStartGame.js'
import { staffErrorCodes } from '../model/errors.js'
import { allowedActions } from '../model/gameTransitions.js'
import ResultForm from './ResultForm.jsx'

export default function GameActions({ booking }) {
  // One mutation per button. Hooks must always be called, so they stay above any early return.
  const mutations = {
    confirm: useConfirmBooking(),
    start: useStartGame(),
    finish: useFinishGame(),
  }

  const [action] = allowedActions(booking)
  if (action === 'register_result') return <ResultForm booking={booking} />
  if (!action) return null

  const mutation = mutations[action]

  return (
    <div>
      <Button loading={mutation.isPending} onClick={() => mutation.mutate(booking.id)}>
        {es.staff.actions[action]}
      </Button>
      {mutation.isError && (
        <Alert tone="error">{mapApiError(mutation.error, staffErrorCodes).message}</Alert>
      )}
    </div>
  )
}
