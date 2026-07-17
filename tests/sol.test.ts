import { describe, expect, it } from 'vitest'

import { direccionLuz, posicionSol } from '../src/experiencia/sol'

const LAT = -38.98
const LNG = -72.65

describe('posicionSol (sur de Chile)', () => {
  it('el sol de invierno al mediodía anda más bajo que el de verano', () => {
    const invierno = posicionSol('invierno', 13, LAT, LNG).elevacion
    const verano = posicionSol('verano', 13, LAT, LNG).elevacion
    expect(invierno).toBeGreaterThan(0)
    expect(verano).toBeGreaterThan(invierno)
  })

  it('a medianoche la elevación es negativa', () => {
    expect(posicionSol('verano', 0, LAT, LNG).elevacion).toBeLessThan(0)
  })

  it('direccionLuz da un vector unitario con y = sin(elevacion)', () => {
    const [x, y, z] = direccionLuz('verano', 13, LAT, LNG)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5)
    expect(y).toBeCloseTo(Math.sin(posicionSol('verano', 13, LAT, LNG).elevacion), 5)
  })
})
