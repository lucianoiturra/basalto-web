import { describe, expect, it } from 'vitest'

import { generarToken } from '../src/lib/token'

describe('generarToken', () => {
  it('genera 43 caracteres seguros para URL', () => {
    const token = generarToken()

    expect(token).toHaveLength(43)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('no se repite en 1000 llamadas', () => {
    const tokens = new Set(Array.from({ length: 1000 }, generarToken))

    expect(tokens.size).toBe(1000)
  })
})
