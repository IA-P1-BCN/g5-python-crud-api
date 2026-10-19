import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import es from '@/i18n/es.js'
import { todayBookingDto } from '@/test/mocks/handlers/staff.js'
import { server } from '@/test/mocks/server.js'
import ResultForm from './ResultForm.jsx'

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ResultForm booking={todayBookingDto({ id: 5, status: 'COMPLETED' })} />
    </QueryClientProvider>,
  )
}

function spyOnResult() {
  const call = { id: null, body: null }
  server.use(
    http.post('*/bookings/:id/result', async ({ request, params }) => {
      call.id = params.id
      call.body = await request.json()
      return HttpResponse.json(todayBookingDto({ id: 5, status: 'COMPLETED' }), { status: 201 })
    }),
  )
  return call
}

const checkbox = () => screen.getByRole('checkbox', { name: es.staff.resultForm.completed })
const timeField = () => screen.getByLabelText(es.staff.resultForm.time)
const saveButton = () => screen.getByRole('button', { name: es.staff.resultForm.save })

describe('ResultForm', () => {
  it('shows the completed checkbox, the time field and a save button', () => {
    renderForm()

    expect(checkbox()).not.toBeChecked()
    expect(timeField()).toBeInTheDocument()
    expect(saveButton()).toBeInTheDocument()
  })

  it('sends a completed game with the time in seconds', async () => {
    const call = spyOnResult()
    renderForm()

    await userEvent.click(checkbox())
    await userEvent.type(timeField(), '1800')
    await userEvent.click(saveButton())

    await waitFor(() => expect(call.body).toEqual({ completed: true, completion_time: 1800 }))
    expect(call.id).toBe('5')
  })

  it('sends a failed game when the box is left unchecked', async () => {
    const call = spyOnResult()
    renderForm()

    await userEvent.type(timeField(), '3600')
    await userEvent.click(saveButton())

    await waitFor(() => expect(call.body).toEqual({ completed: false, completion_time: 3600 }))
  })

  it('asks for the time and sends nothing when it is empty', async () => {
    const call = spyOnResult()
    renderForm()

    await userEvent.click(saveButton())

    expect(await screen.findByText(es.staff.timeRequired)).toBeInTheDocument()
    expect(call.body).toBeNull()
  })

  it('rejects a negative time', async () => {
    const call = spyOnResult()
    renderForm()

    await userEvent.type(timeField(), '-5')
    await userEvent.click(saveButton())

    expect(await screen.findByText(es.staff.timeInvalid)).toBeInTheDocument()
    expect(call.body).toBeNull()
  })

  it('shows DUPLICATE as a message when the result already exists', async () => {
    server.use(
      http.post('*/bookings/:id/result', () =>
        HttpResponse.json(
          { detail: 'Result already registered', code: 'DUPLICATE' },
          { status: 409 },
        ),
      ),
    )
    renderForm()

    await userEvent.type(timeField(), '1800')
    await userEvent.click(saveButton())

    expect(await screen.findByText(es.staff.errors.DUPLICATE)).toBeInTheDocument()
  })
})
