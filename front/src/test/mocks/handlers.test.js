import { handlers } from './handlers.js'

it('composes the per-feature MSW handlers into one array', () => {
  expect(Array.isArray(handlers)).toBe(true)
})
