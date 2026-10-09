import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import es from '@/i18n/es.js'
import Pagination from './Pagination.jsx'

const setup = (props) => {
  const onPageChange = vi.fn()
  render(<Pagination page={2} size={20} total={100} onPageChange={onPageChange} {...props} />)
  return onPageChange
}

describe('Pagination', () => {
  it('shows the current page and the page count', () => {
    setup()
    expect(screen.getByText(es.common.pageOf(2, 5))).toBeInTheDocument()
  })

  it('rounds the page count up (41 items, 20 per page = 3 pages)', () => {
    setup({ page: 1, total: 41 })
    expect(screen.getByText(es.common.pageOf(1, 3))).toBeInTheDocument()
  })

  it('goes to the previous and next page', async () => {
    const onPageChange = setup()
    await userEvent.click(screen.getByRole('button', { name: es.common.next }))
    await userEvent.click(screen.getByRole('button', { name: es.common.previous }))
    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('marks previous as unavailable on the first page and ignores clicks', async () => {
    const onPageChange = setup({ page: 1 })
    const previous = screen.getByRole('button', { name: es.common.previous })
    expect(previous).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: es.common.next })).not.toHaveAttribute(
      'aria-disabled',
    )
    await userEvent.click(previous)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('marks next as unavailable on the last page and ignores clicks', async () => {
    const onPageChange = setup({ page: 5 })
    const next = screen.getByRole('button', { name: es.common.next })
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: es.common.previous })).not.toHaveAttribute(
      'aria-disabled',
    )
    await userEvent.click(next)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it.each([[0], [20]])('renders nothing when %i items fit in one page', (total) => {
    const { container } = render(
      <Pagination page={1} size={20} total={total} onPageChange={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
