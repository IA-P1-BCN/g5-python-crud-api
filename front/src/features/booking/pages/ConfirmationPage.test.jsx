import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import ConfirmationPage, { ConfirmationPage as NamedConfirmationPage } from './ConfirmationPage'
import { useBookingDraftStore } from '../model/bookingDraft.store'
import texts from '@/i18n/es/booking'
import { formatDateTime } from '@/shared/lib/format.js'

describe('ConfirmationPage', () => {
  it('is also a named export, which booking/routes.js imports', () => {
    expect(NamedConfirmationPage).toBe(ConfirmationPage)
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

  it('redirects to my bookings when there is no booking in the route state (page reload)', () => {
    render(
      <MemoryRouter initialEntries={['/booking/confirmation']}>
        <Routes>
          <Route path="/booking/confirmation" element={<ConfirmationPage />} />
          <Route path="/mis-reservas" element={<p>my-bookings-page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('my-bookings-page')).toBeInTheDocument()
    expect(screen.queryByText(texts.confirmation.title)).not.toBeInTheDocument()
  })

  it('shows the title and the stamp when there is a booking', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/booking/confirmation', state: { booking: { id: 1 } } }]}
      >
        <ConfirmationPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(texts.confirmation.title)).toBeInTheDocument()
    expect(screen.getByText(texts.confirmation.stamp)).toBeInTheDocument()
  })

  it('clears the booking draft once the booking is confirmed', () => {
    useBookingDraftStore.getState().startRoom('faro')
    useBookingDraftStore.getState().setSelectedSlot({ id: 3 })

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/booking/confirmation', state: { booking: { id: 1 } } }]}
      >
        <ConfirmationPage />
      </MemoryRouter>,
    )

    expect(useBookingDraftStore.getState().slotId).toBeNull()
  })
})
