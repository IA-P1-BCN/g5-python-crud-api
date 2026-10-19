import { useState } from 'react'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
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
    <Field
      label={t.form[name]}
      name={name}
      type={type}
      value={values[name]}
      onChange={handleChange}
      error={errors[name] && t.form.errors[errors[name]]}
    />
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 py-4">
      {field('date', 'date')}
      {field('startTime', 'time')}
      {field('endTime', 'time')}
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>
          {submitting ? t.form.saving : t.form.save}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            {t.form.cancel}
          </Button>
        )}
      </div>
    </form>
  )
}
