// CheckoutPage: players dial + ticket + validated form (name, email, phone). Does not call the API.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import es from '@/i18n/es.js'
import { formatPrice } from '@/shared/lib/format.js'
import { CheckoutPage } from './CheckoutPage'

const room = { name: 'El Faro', minPlayers: 2, maxPlayers: 5, pricePerPlayer: 15 }
const t = es.booking.checkout

// formatPrice uses a non-breaking space before the euro sign; Testing Library turns it into a normal one.
const price = (amount) => formatPrice(amount).replace(/\s/g, ' ')

function setup() {
  const onSubmit = vi.fn()
  render(<CheckoutPage room={room} onSubmit={onSubmit} />)
  return { user: userEvent.setup(), onSubmit }
}

describe('CheckoutPage', () => {
  it('starts at the minimum number of players and shows the total', () => {
    setup()

    expect(screen.getByText(price(30))).toBeInTheDocument() // 2 players x 15
  })

  it('updates the total when another number of players is chosen', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(screen.getByText(price(60))).toBeInTheDocument() // 4 players x 15
  })

  it('shows the errors and does not submit an empty form', async () => {
    const { user, onSubmit } = setup()

    await user.click(screen.getByRole('button', { name: t.submit }))

    expect(await screen.findByText(es.booking.errors.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(es.booking.errors.emailInvalid)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the form data with the number of players', async () => {
    const { user, onSubmit } = setup()

    await user.type(screen.getByLabelText(t.name), 'Ana Lopez')
    await user.type(screen.getByLabelText(t.email), 'ana@example.com')
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: t.submit }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Ana Lopez',
        email: 'ana@example.com',
        phone: '',
        players: 3,
      }),
    )
  })
})
