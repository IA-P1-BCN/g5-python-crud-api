import { readFileSync } from 'node:fs'

// Vitest empties CSS imports, so read the file from disk (same trick as theme.test.js).
const css = readFileSync('src/index.css', 'utf8')
const block = (selector) => css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('global page style', () => {
  it('body uses the site background, text colour and body font', () => {
    const body = block('body')
    expect(body).toContain('background-color: var(--color-bg)')
    expect(body).toContain('color: var(--color-text)')
    expect(body).toContain('font-family: var(--font-sans)')
  })

  it('body text is 17px with a 1.55 line height (mockup)', () => {
    const body = block('body')
    expect(body).toContain('font-size: 17px')
    expect(body).toContain('line-height: 1.55')
  })
})

describe('type scale', () => {
  it.each(['heading-hero', 'heading-title'])('%s is a utility in the display font', (name) => {
    expect(block(`@utility ${name}`)).toContain('font-family: var(--font-display)')
  })

  it('label-caps is a small uppercase label', () => {
    const label = block('@utility label-caps')
    expect(label).toContain('text-transform: uppercase')
    expect(label).toContain('font-size: 11px')
  })
})

describe('layout', () => {
  it('the md breakpoint is the 800px of the mockup, in rem like the other Tailwind breakpoints', () => {
    expect(block('@theme')).toContain('--breakpoint-md: 50rem')
  })
})
