import { readdirSync, readFileSync } from 'node:fs'

// Every component and page must use the design tokens (bg-surface, text-muted, border-error...), never the
// default Tailwind palette (bg-zinc-700, text-red-300...). See the @theme block in index.css.
const PALETTE =
  /\b(?:bg|text|border|outline|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

// Arbitrary colours (bg-[#0a0b0d], text-[rgb(...)]) skip the tokens too.
const ARBITRARY = /\b[a-z-]+-\[(?:#|rgb|hsl)[^\]]*\]/

// Source files of the whole app (components, pages, scene code), without tests.
const sources = readdirSync('src', { recursive: true })
  .filter((file) => /\.jsx?$/.test(file) && !/\.test\./.test(file))
  .map((file) => file.replaceAll('\\', '/'))

describe('design tokens', () => {
  it.each(sources)('%s uses design tokens, not the Tailwind palette', (file) => {
    const source = readFileSync(`src/${file}`, 'utf8')
    expect(source.match(PALETTE)?.[0]).toBeUndefined()
    expect(source.match(ARBITRARY)?.[0]).toBeUndefined()
  })

  // The site is always dark. `dark:` follows the OS setting, so it would style the same
  // component differently for people whose system is in light mode.
  it.each(sources)('%s has no dark: variants', (file) => {
    expect(readFileSync(`src/${file}`, 'utf8')).not.toMatch(/\bdark:[\w[!-]/)
  })
})
