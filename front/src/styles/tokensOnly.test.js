import { readdirSync, readFileSync } from 'node:fs'

const BLACK_WHITE =
  /\b(?:bg|text|border|outline|ring|fill|stroke|from|via|to)-(?:black|white)(?![\w-])/

const PALETTE =
  /\b(?:bg|text|border|outline|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

const ARBITRARY = /\b[a-z-]+-\[(?:#|rgb|hsl)[^\]]*\]/

const sources = readdirSync('src', { recursive: true })
  .filter((file) => /\.jsx?$/.test(file) && !/\.test\./.test(file))
  .map((file) => file.replaceAll('\\', '/'))

describe('design tokens', () => {
  it.each(sources)('%s uses design tokens, not the Tailwind palette', (file) => {
    const source = readFileSync(`src/${file}`, 'utf8')
    expect(source.match(PALETTE)?.[0]).toBeUndefined()
    expect(source.match(ARBITRARY)?.[0]).toBeUndefined()
    expect(source.match(BLACK_WHITE)?.[0]).toBeUndefined()
  })

  it.each(sources)('%s has no dark: variants', (file) => {
    expect(readFileSync(`src/${file}`, 'utf8')).not.toMatch(/\bdark:[\w[!-]/)
  })
})
