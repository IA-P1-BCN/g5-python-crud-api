import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import { bookingDto } from '@/test/mocks/handlers/myBookings.js'
import { server } from '@/test/mocks/server.js'
import CancelDialog from './CancelDialog.jsx'

const t = es.myBookings

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <CancelDialog booking={bookingDto()} open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return onOpenChange
}

describe('CancelDialog', () => {
  it('asks for confirmation, cancels the booking and closes', async () => {
    let called = false
    server.use(
      http.put('/api/v1/bookings/1/cancel', () => {
        called = true
        return HttpResponse.json(bookingDto({ status: 'CANCELLED' }))
      }),
    )
    const onOpenChange = renderDialog()

    expect(screen.getByRole('dialog', { name: t.cancelDialog.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: t.cancelDialog.confirm }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(called).toBe(true)
  })

  it('does not call the API when the client keeps the booking', async () => {
    let called = false
    server.use(
      http.put('/api/v1/bookings/1/cancel', () => {
        called = true
        return HttpResponse.json(bookingDto())
      }),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: t.cancelDialog.keep }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(called).toBe(false)
  })

  it('shows the too-late message and stays open when the API refuses (24h rule)', async () => {
    server.use(
      http.put('/api/v1/bookings/1/cancel', () =>
        HttpResponse.json(
          { detail: 'Too late to cancel', code: 'TOO_LATE_TO_CANCEL' },
          { status: 409 },
        ),
      ),
    )
    const onOpenChange = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: t.cancelDialog.confirm }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t.errors.tooLateToCancel)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
