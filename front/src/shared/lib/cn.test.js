import { cn } from './cn.js'

describe('cn', () => {
  it('lets the last class of the same family win', () => {
    expect(cn('min-h-11', 'min-h-14')).toBe('min-h-14')
  })

  it('knows our custom radius and shadow tokens, so callers can override them', () => {
    expect(cn('rounded-pill', 'rounded-md')).toBe('rounded-md')
    expect(cn('rounded-md', 'rounded-pill')).toBe('rounded-pill')
    expect(cn('shadow-glow', 'shadow-md')).toBe('shadow-md')
  })

  it('does not drop unrelated classes', () => {
    expect(cn('rounded-pill', 'shadow-glow', 'text-muted')).toBe(
      'rounded-pill shadow-glow text-muted',
    )
  })
})
