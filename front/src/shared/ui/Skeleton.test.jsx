import { render } from '@testing-library/react'
import Skeleton from './Skeleton.jsx'

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('pulses, except for users who prefer reduced motion', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse', 'motion-reduce:animate-none')
  })

  it('takes its size from className', () => {
    const { container } = render(<Skeleton className="h-40 w-full" />)
    expect(container.firstChild).toHaveClass('h-40', 'w-full')
  })
})
