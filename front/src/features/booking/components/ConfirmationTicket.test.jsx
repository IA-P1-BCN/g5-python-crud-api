import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { formatDateTime } from '@/shared/lib/format.js'
import { ConfirmationTicket } from './ConfirmationTicket'

describe('ConfirmationTicket', () => {
  it('muestra el id de reserva y el titular', () => {
    render(
      <ConfirmationTicket
        bookingId="B-123"
        clientName="Usuario Test"
        startsAt="2030-11-06T10:00:00Z"
      />,
    )

    expect(screen.getByText('B-123')).toBeInTheDocument()
    expect(screen.getByText('Usuario Test')).toBeInTheDocument()
  })

  it('muestra la fecha y la hora formateadas, no el id del slot', () => {
    render(<ConfirmationTicket bookingId="B-1" startsAt="2030-11-06T10:00:00Z" />)

    expect(screen.getByText(formatDateTime('2030-11-06T10:00:00Z'))).toBeInTheDocument()
  })

  it('muestra PENDIENTE si todavía no hay id de reserva', () => {
    render(<ConfirmationTicket clientName="Usuario Test" startsAt="2030-11-06T10:00:00Z" />)

    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
  })
})
