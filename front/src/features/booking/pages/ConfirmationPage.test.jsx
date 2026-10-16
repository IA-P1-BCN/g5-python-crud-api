import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ConfirmationPage from './ConfirmationPage';
import texts from '@/i18n/es/booking';

describe('ConfirmationPage', () => {
  it('renderiza el título de confirmación y el sello animado', () => {
    render(
      <MemoryRouter>
        <ConfirmationPage />
      </MemoryRouter>
    );
    
    // Verifica los textos principales
    expect(screen.getByText(texts.confirmation.title)).toBeInTheDocument();
    expect(screen.getByText(texts.confirmation.subtitle)).toBeInTheDocument();
    
    // Verifica que el componente Stamp esté presente
    expect(screen.getByText(texts.confirmation.stamp)).toBeInTheDocument();
  });

  it('muestra los datos del ticket cuando se proporcionan a través del estado de la ruta', () => {
    const mockBooking = {
      id: 'reserva-test-789',
      clientName: 'Loris Garcia',
      slotId: '10:00 AM'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/confirmation', state: { booking: mockBooking } }]}>
        <ConfirmationPage />
      </MemoryRouter>
    );

    // Verifica que los datos inyectados se muestren en el ticket
    expect(screen.getByText('reserva-test-789')).toBeInTheDocument();
    expect(screen.getByText('Loris Garcia')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('maneja de forma segura la ausencia de datos (fallback) si el usuario recarga la página', () => {
    render(
      <MemoryRouter initialEntries={['/booking/confirmation']}>
        <ConfirmationPage />
      </MemoryRouter>
    );

    // Verifica que use los fallbacks cuando no hay datos en el estado
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
    expect(screen.getByText(texts.checkout.unspecified)).toBeInTheDocument();
  });
});