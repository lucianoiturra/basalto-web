import { describe, expect, it } from 'vitest'

import { colorCielo } from '../src/experiencia/cielo'

describe('colorCielo', () => {
  it('p=0 es la tarde clara', () => {
    expect(colorCielo(0).bg).toBe('rgb(239,233,221)')
    expect(colorCielo(0).fg).toBe('rgb(38,36,30)')
  })

  it('p=1 es la noche', () => {
    expect(colorCielo(1).bg).toBe('rgb(14,15,13)')
    expect(colorCielo(1).fg).toBe('rgb(232,228,220)')
  })

  it('interpola entre keyframes', () => {
    const medio = colorCielo(0.08)
    expect(medio.bg).toBe('rgb(237,228,210)')
  })

  it('clampa fuera de rango', () => {
    expect(colorCielo(-1).bg).toBe(colorCielo(0).bg)
    expect(colorCielo(2).bg).toBe(colorCielo(1).bg)
  })
})
