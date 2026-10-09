import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const css = readFileSync('src/index.css', 'utf8')
const main = readFileSync('src/main.jsx', 'utf8')
const resolve = createRequire(import.meta.url).resolve

// The fonts are self-hosted with @fontsource and imported in main.jsx.
const FONTS = [
  ['--font-display', 'Big Shoulders Display', 'big-shoulders-display'],
  ['--font-sans', 'Hanken Grotesk', 'hanken-grotesk'],
  ['--font-mono', 'Share Tech Mono', 'share-tech-mono'],
]
const imports = [...main.matchAll(/import '(@fontsource\/[^']+)'/g)].map((m) => m[1])

describe('fonts', () => {
  it.each(FONTS)('%s is declared in @theme as %s', (token, family) => {
    expect(css).toMatch(new RegExp(`${token}:[^;]*${family}`))
  })

  it.each(FONTS)('main.jsx imports at least one weight of %s (%s)', (_token, _family, pkg) => {
    expect(imports.some((name) => name.startsWith(`@fontsource/${pkg}/`))).toBe(true)
  })

  // Catches what broke the build once: `latin-700.css` is not exported by every package.
  it.each(imports)('%s resolves to a real file', (name) => {
    expect(() => resolve(name)).not.toThrow()
  })
})
