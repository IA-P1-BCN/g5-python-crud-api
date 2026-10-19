import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from './EmptyState.jsx'

describe('EmptyState', () => {
  it('shows the title as a heading and the description', () => {
    render(<EmptyState title="Sin reservas" description="Aún no has reservado ninguna sala." />)
    expect(screen.getByRole('heading', { name: 'Sin reservas' })).toBeInTheDocument()
    expect(screen.getByText('Aún no has reservado ninguna sala.')).toBeInTheDocument()
  })

  it('shows no button without an action', () => {
    render(<EmptyState title="Sin reservas" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the action the page gives it', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState title="Sin reservas" action={<button onClick={onClick}>Ver salas</button>} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ver salas' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
