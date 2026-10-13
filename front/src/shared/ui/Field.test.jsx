import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import Field from './Field.jsx'

describe('Field', () => {
  it('links the label to the input', () => {
    render(<Field label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('passes input props through (type, name) and forwards the ref for React Hook Form', () => {
    const ref = createRef()
    render(<Field label="Email" type="email" name="email" ref={ref} />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(ref.current).toBe(input)
  })

  it('is valid and silent without an error', () => {
    render(<Field label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the error, announces it and links it to the input', () => {
    render(<Field label="Email" error="Email inválido" />)
    const input = screen.getByLabelText('Email')
    expect(screen.getByRole('alert')).toHaveTextContent('Email inválido')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Email inválido')
  })

  it('lets callers add classes to the input', () => {
    render(<Field label="Email" className="w-full" />)
    expect(screen.getByLabelText('Email')).toHaveClass('w-full')
  })

  it('keeps the label linked when the caller passes an id', () => {
    render(<Field label="Email" id="email" error="Email inválido" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'email')
    expect(input).toHaveAccessibleDescription('Email inválido')
  })

  it('keeps the error description next to a caller aria-describedby', () => {
    render(
      <>
        <p id="hint">Usa tu email de trabajo</p>
        <Field label="Email" aria-describedby="hint" error="Email inválido" />
      </>,
    )
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Usa tu email de trabajo Email inválido',
    )
  })
})
