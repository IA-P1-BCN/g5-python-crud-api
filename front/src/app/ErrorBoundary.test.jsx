import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import es from '@/i18n/es.js'
import ErrorBoundary from './ErrorBoundary.jsx'

function Boom() {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('shows a friendly message instead of a blank page when a page crashes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: es.common.crash.title })).toBeInTheDocument()
  })

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>ok</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
