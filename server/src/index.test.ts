import { describe, expect, it } from 'vitest'
// Lightweight smoke test: ensure server file can be imported without crashing.
describe('server smoke', () => {
  it('imports without throwing', async () => {
    await expect(import('./index.js')).resolves.toBeTruthy()
  })
})

