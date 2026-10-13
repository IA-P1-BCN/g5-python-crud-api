import { readFileSync } from 'node:fs'

// Vitest empties CSS imports, so read the files from disk (same trick as theme.test.js).
const css = readFileSync('src/index.css', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const alias = (name) => css.match(new RegExp(`--color-${name}:\\s*([^;]+);`))?.[1].trim()

describe('shadcn/ui theme aliases', () => {
  // Tailwind drops unknown classes without an error, so a missing colour fails silently.
  it.each(['destructive', 'primary', 'primary-foreground'])(
    '--color-%s exists for the classes shadcn components use',
    (name) => {
      expect(alias(name)).toBeDefined()
    },
  )

  it('highlighted options (accent) stand out from the list background (popover)', () => {
    expect(alias('accent')).toBeDefined()
    expect(alias('accent')).not.toBe(alias('popover'))
  })

  it('animation classes (animate-in, fade-in-0...) come from tw-animate-css, installed and imported', () => {
    expect(pkg.dependencies).toHaveProperty('tw-animate-css')
    expect(css).toMatch(/@import\s+['"]tw-animate-css['"]/)
  })
})
