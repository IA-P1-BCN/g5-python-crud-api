import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import CheckoutPage from './CheckoutPage'
import { useBookingDraftStore } from '../model/bookingDraft.store'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (ui) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('CheckoutPage Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBookingDraftStore.getState().resetDraft()

    // Semillamos el store con datos genéricos y anónimos
    useBookingDraftStore.getState().setClientDetails({
      name: 'Usuario Test',
      email: 'test@example.com',
      phone: '555-0000',
    })
  })

  it('completes the success flow and redirects to the confirmation screen with booking state', async () => {
    const user = userEvent.setup()
    useBookingDraftStore
      .getState()
      .setSelectedSlot({ id: 'valid-slot-123', starts_at: '2030-11-06T10:00:00Z' })

    renderWithRouter(<CheckoutPage />)

    const submitButton = screen.getByRole('button', { name: /confirmar reserva/i })
    await user.click(submitButton)

    // Verificamos que navigate fue llamado incluyendo el state con la reserva
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/booking/confirmation',
        expect.objectContaining({
          state: expect.objectContaining({
            booking: expect.objectContaining({
              startsAt: '2030-11-06T10:00:00Z',
              clientName: 'Usuario Test',
            }),
          }),
        }),
      )
    })

    expect(useBookingDraftStore.getState().slotId).toBeNull()
  })

  it('displays a SLOT_TAKEN error near the submit button when the slot is snatched', async () => {
    const user = userEvent.setup()
    useBookingDraftStore.getState().setSlotId('error-slot-taken')

    renderWithRouter(<CheckoutPage />)

    const submitButton = screen.getByRole('button', { name: /confirmar reserva/i })
    await user.click(submitButton)

    // findByText espera asíncronamente a que aparezca el error de disponibilidad
    const errorMessage = await screen.findByText((content) =>
      content.includes('no está disponible'),
    )
    expect(errorMessage).toBeInTheDocument()

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useBookingDraftStore.getState().clientDetails.name).toBe('Usuario Test')
  })
})
