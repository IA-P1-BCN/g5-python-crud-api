import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import es from '@/i18n/es.js'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog.jsx'

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Cancelar reserva</DialogTrigger>
      <DialogContent>
        <DialogTitle>¿Cancelar la reserva?</DialogTitle>
        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog (shadcn)', () => {
  it('opens as an accessible dialog with its title and description', async () => {
    render(<Example />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }))
    const dialog = screen.getByRole('dialog', { name: '¿Cancelar la reserva?' })
    expect(dialog).toHaveAccessibleDescription('Esta acción no se puede deshacer.')
  })

  it('has a close button big enough to tap', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }))
    expect(screen.getByRole('button', { name: es.common.close })).toHaveClass(
      'min-h-11',
      'min-w-11',
    )
  })
})
