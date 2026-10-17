import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ConfirmationTicket } from './ConfirmationTicket'

describe('ConfirmationTicket', () => {
  it('muestra el id de reserva y el titular', () => {
    render(<ConfirmationTicket bookingId="B-123" clientName="Usuario Test" slotId="slot-1" />)

    expect(screen.getByText('B-123')).toBeInTheDocument()
    expect(screen.getByText('Usuario Test')).toBeInTheDocument()
  })

  it('muestra PENDIENTE si todavía no hay id de reserva', () => {
    render(<ConfirmationTicket clientName="Usuario Test" slotId="slot-1" />)

    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
  })
})
