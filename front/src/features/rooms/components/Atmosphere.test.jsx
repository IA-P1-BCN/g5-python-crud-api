import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Atmosphere from './Atmosphere.jsx'

describe('Atmosphere', () => {
  it.each([
    ['relojero', 'clock'],
    ['biblioteca', 'dust'],
    ['faro', 'beam'],
    ['atraco', 'lasers'],
    ['lab', 'scan'],
    ['nueva-sala', 'none'],
  ])('room %s gets the %s ambiance', (slug, ambiance) => {
    render(<Atmosphere slug={slug} />)

    expect(screen.getByTestId('atmosphere')).toHaveAttribute('data-ambiance', ambiance)
  })

  it('takes the colours of its room and is hidden from screen readers', () => {
    render(<Atmosphere slug="faro" />)

    const layer = screen.getByTestId('atmosphere')
    expect(layer).toHaveAttribute('data-room', 'faro')
    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })
})
