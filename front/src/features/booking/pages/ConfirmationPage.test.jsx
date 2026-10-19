import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import ConfirmationPage, { ConfirmationPage as NamedConfirmationPage } from './ConfirmationPage'
import texts from '@/i18n/es/booking'
import { formatDateTime } from '@/shared/lib/format.js'

describe('ConfirmationPage', () => {
  it('is also a named export, which booking/routes.js imports', () => {
    expect(NamedConfirmationPage).toBe(ConfirmationPage)
  })

  it('renderiza el título de confirmación y el sello animado', () => {
    render(
      <MemoryRouter>
        <ConfirmationPage />
      </MemoryRouter>,
    )

    // Verifica los textos principales
    expect(screen.getByText(texts.confirmation.title)).toBeInTheDocument()
    expect(screen.getByText(texts.confirmation.subtitle)).toBeInTheDocument()

    // Verifica que el componente Stamp esté presente
    expect(screen.getByText(texts.confirmation.stamp)).toBeInTheDocument()
  })

  it('muestra los datos del ticket cuando se proporcionan a través del estado de la ruta', () => {
    const mockBooking = {
      id: 'reserva-test-789',
      clientName: 'Loris Garcia',
      startsAt: '2030-11-06T10:00:00Z',
    }

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/booking/confirmation', state: { booking: mockBooking } }]}
      >
        <ConfirmationPage />
      </MemoryRouter>,
    )

    // Verifica que los datos inyectados se muestren en el ticket
    expect(screen.getByText('reserva-test-789')).toBeInTheDocument()
    expect(screen.getByText('Loris Garcia')).toBeInTheDocument()
    expect(screen.getByText(formatDateTime('2030-11-06T10:00:00Z'))).toBeInTheDocument()
  })

  it('maneja de forma segura la ausencia de datos (fallback) si el usuario recarga la página', () => {
    render(
      <MemoryRouter initialEntries={['/booking/confirmation']}>
        <ConfirmationPage />
      </MemoryRouter>,
    )

    // Verifica que use los fallbacks cuando no hay datos en el estado
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
    expect(screen.getByText(texts.checkout.unspecified)).toBeInTheDocument()
  })
})
