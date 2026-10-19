import { useState } from 'react'
import adminRooms from '@/i18n/es/adminRooms'
import Alert from '@/shared/ui/Alert.jsx'
import Button from '@/shared/ui/Button.jsx'
import Field from '@/shared/ui/Field.jsx'
import { generateSlotsSchema } from '../model/generateSlotsSchema'

const t = adminRooms.slots.generate

const EMPTY = { date_from: '', date_to: '', first_start: '', last_start: '' }

// onGenerate(payload) resolves to { success, data: { created_count, skipped_count } } or
// { success: false, error: code }.
export default function GenerateSlotsForm({ onGenerate }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { ok, text }

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setResult(null)
    const parsed = generateSlotsSchema.safeParse(values)
    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) next[issue.path[0]] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setSubmitting(true)
    const res = await onGenerate(parsed.data)
    setSubmitting(false)
    setResult(
      res.success
        ? { ok: true, text: t.done(res.data.created_count, res.data.skipped_count) }
        : {
            ok: false,
            text: adminRooms.slots.errors[res.error] ?? adminRooms.slots.errors.UNKNOWN,
          },
    )
  }

  const field = (name, type) => (
    <Field
      label={t.labels[name]}
      name={name}
      type={type}
      value={values[name]}
      onChange={handleChange}
      error={errors[name]}
    />
  )

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-line space-y-4 rounded-lg border p-4"
    >
      <h2 className="heading-title">{t.title}</h2>
      <p className="text-muted text-sm">{t.help}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('date_from', 'date')}
        {field('date_to', 'date')}
        {field('first_start', 'time')}
        {field('last_start', 'time')}
      </div>
      {result && <Alert tone={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
      <Button type="submit" loading={submitting}>
        {t.submit}
      </Button>
    </form>
  )
}
