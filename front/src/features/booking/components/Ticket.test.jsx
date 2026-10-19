import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/shared/lib/format.js'
import { Ticket } from './Ticket'

const price = (amount) => formatPrice(amount).replace(/\s/g, ' ')

describe('Ticket', () => {
  it('shows the room name and the total price', () => {
    render(<Ticket roomName="El Faro" players={4} pricePerPlayer={15} />)

    expect(screen.getByText('El Faro')).toBeInTheDocument()
    expect(screen.getByText(price(60))).toBeInTheDocument()
  })

  it('updates the total when the number of players changes', () => {
    const { rerender } = render(<Ticket roomName="El Faro" players={4} pricePerPlayer={15} />)

    rerender(<Ticket roomName="El Faro" players={2} pricePerPlayer={15} />)

    expect(screen.getByText(price(30))).toBeInTheDocument()
  })
})
