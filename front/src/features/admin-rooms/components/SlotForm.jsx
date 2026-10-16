import { useState } from 'react'
import adminRooms from '@/i18n/es/adminRooms'
import { slotSchema } from '../model/slotSchema'

const t = adminRooms.slots

const EMPTY = { date: '', startTime: '', endTime: '' }

export default function SlotForm({ initialData = EMPTY, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    date: initialData.date ?? '',
    startTime: initialData.startTime ?? '',
    endTime: initialData.endTime ?? '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = slotSchema.safeParse(values)
    if (!result.success) {
      const next = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (field && !next[field]) next[field] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name, type) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {t.form[name]}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="w-full rounded border p-2"
      />
      {errors[name] && (
        <p id={`${name}-error`} className="text-error text-sm">
          {t.form.errors[errors[name]]}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4">
      {field('date', 'date')}
      {field('startTime', 'time')}
      {field('endTime', 'time')}
      <div className="flex space-x-2">
        <button type="submit" disabled={submitting} className="rounded border px-4 py-2">
          {submitting ? t.form.saving : t.form.save}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded border px-4 py-2">
            {t.form.cancel}
          </button>
        )}
      </div>
    </form>
  )
}
