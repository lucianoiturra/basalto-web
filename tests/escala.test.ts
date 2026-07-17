import { describe, expect, it } from 'vitest'

import { aViewBox } from '../src/experiencia/escala'

const muros = [
  { de: [0, 0] as [number, number], a: [10, 0] as [number, number], grosor: 3 },
  { de: [10, 0] as [number, number], a: [10, 5] as [number, number] },
]
const recintos = [
  {
    nombre: 'COCINA',
    superficie: 14.27,
    poligono: [
      [0, 0],
      [10, 0],
      [10, 5],
      [0, 5],
    ] as [number, number][],
  },
]

describe('aViewBox', () => {
  it('escala 18 px/metro con margen 8', () => {
    const r = aViewBox(muros, recintos)
    expect(r.viewBox).toBe('0 0 196 106')
    expect(r.segmentos[0]).toEqual({ x1: 8, y1: 8, x2: 188, y2: 8, grosor: 3 })
    expect(r.segmentos[1].grosor).toBe(1.1)
  })

  it('polígonos con puntos SVG y centro', () => {
    const r = aViewBox(muros, recintos)
    expect(r.poligonos[0].puntos).toBe('8,8 188,8 188,98 8,98')
    expect(r.poligonos[0].centro).toEqual([98, 53])
  })
})
