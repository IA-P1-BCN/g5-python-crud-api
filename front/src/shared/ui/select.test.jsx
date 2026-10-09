import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.jsx'

// jsdom lacks these browser APIs, which Radix Select calls when it opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

function Example({ onValueChange }) {
  return (
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Jugadores">
        <SelectValue placeholder="Elige" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="2">2 jugadores</SelectItem>
        <SelectItem value="4">4 jugadores</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select (shadcn)', () => {
  it('shows the placeholder in an accessible combobox', () => {
    render(<Example />)
    expect(screen.getByRole('combobox', { name: 'Jugadores' })).toHaveTextContent('Elige')
  })

  it('lets the user pick an option', async () => {
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Jugadores' }))
    await userEvent.click(await screen.findByRole('option', { name: '4 jugadores' }))
    expect(onValueChange).toHaveBeenCalledWith('4')
    expect(screen.getByRole('combobox', { name: 'Jugadores' })).toHaveTextContent('4 jugadores')
  })
})
