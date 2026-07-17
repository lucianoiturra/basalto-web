import { describe, expect, it } from 'vitest'

import { validarPoligono } from '../src/lib/poligono'

describe('validarPoligono', () => {
  it('acepta un triángulo válido', () => {
    expect(
      validarPoligono([
        [0, 0],
        [10, 0],
        [10, 10],
      ]),
    ).toBe(true)
  })

  it('rechaza menos de 3 vértices', () => {
    expect(
      validarPoligono([
        [0, 0],
        [1, 1],
      ]),
    ).toMatch(/al menos 3/)
  })

  it('rechaza vértices no numéricos', () => {
    expect(
      validarPoligono([
        [0, 0],
        ['a', 1],
        [2, 2],
      ]),
    ).toMatch(/números/)
  })

  it('rechaza valores que no son un arreglo', () => {
    expect(validarPoligono('hola')).toMatch(/arreglo/)
  })

  it('rechaza números no finitos', () => {
    expect(
      validarPoligono([
        [0, 0],
        [Number.NaN, 1],
        [2, 2],
      ]),
    ).toMatch(/finitos/)
  })
})
