import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';
import { useBookingDraftStore } from '../model/bookingDraft.store';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CheckoutPage Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookingDraftStore.getState().resetDraft();
    
    // Semillamos el store con los campos correctos (name, email, phone)
    useBookingDraftStore.getState().setClientDetails({
      name: 'Isbel',
      email: 'isbel@example.com',
      phone: '555-1234',
    });
  });

  it('completes the success flow and redirects to the confirmation screen with booking state', async () => {
    const user = userEvent.setup();
    useBookingDraftStore.getState().setSlotId('valid-slot-123');
    
    renderWithRouter(<CheckoutPage />);
    
    const submitButton = screen.getByRole('button', { name: /confirmar reserva/i });
    await user.click(submitButton);
    
    // Verificamos que navigate fue llamado incluyendo el state con la reserva
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/booking/confirmation',
        expect.objectContaining({
          state: expect.objectContaining({
            booking: expect.objectContaining({
              slotId: 'valid-slot-123',
              clientName: 'Isbel',
            }),
          }),
        })
      );
    });
    
    expect(useBookingDraftStore.getState().slotId).toBeNull();
  });

  it('displays a SLOT_TAKEN error near the submit button when the slot is snatched', async () => {
    const user = userEvent.setup();
    useBookingDraftStore.getState().setSlotId('error-slot-taken');
    
    renderWithRouter(<CheckoutPage />);
    
    const submitButton = screen.getByRole('button', { name: /confirmar reserva/i });
    await user.click(submitButton);
    
    const errorMessage = await screen.findByText(/el horario seleccionado ya no está disponible/i);
    expect(errorMessage).toBeInTheDocument();
    
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(useBookingDraftStore.getState().clientDetails.name).toBe('Isbel');
  });
});