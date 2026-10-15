import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import es from '@/i18n/es.js'
import { mapApiError } from '@/shared/api/errors.js'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { useRegisterResult } from '../hooks/useRegisterResult.js'
import { staffErrorCodes } from '../model/errors.js'
import { resultSchema } from '../model/resultSchema.js'

export default function ResultForm({ booking }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resultSchema),
    defaultValues: { completed: false, completion_time: '' },
  })
  const mutation = useRegisterResult()

  // `result` is what the schema returned: completion_time is already a number.
  const onSubmit = (result) => mutation.mutate({ id: booking.id, result })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="accent-exit size-5" {...register('completed')} />
        {es.staff.resultForm.completed}
      </label>
      <Field
        label={es.staff.resultForm.time}
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        error={errors.completion_time?.message}
        {...register('completion_time')}
      />
      <Button type="submit" loading={mutation.isPending}>
        {es.staff.resultForm.save}
      </Button>
      {mutation.isError && (
        <Alert tone="error">{mapApiError(mutation.error, staffErrorCodes).message}</Alert>
      )}
    </form>
  )
}
