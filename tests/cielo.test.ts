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

  it('mantiene contraste AA durante todo el atardecer', () => {
    const parsear = (color: string) =>
      color.match(/\d+/g)!.map(Number) as [number, number, number]
    const luminancia = (color: [number, number, number]) =>
      color
        .map((canal) => {
          const valor = canal / 255
          return valor <= 0.04045
            ? valor / 12.92
            : ((valor + 0.055) / 1.055) ** 2.4
        })
        .reduce(
          (total, canal, indice) =>
            total + canal * ([0.2126, 0.7152, 0.0722][indice] ?? 0),
          0,
        )
    const contraste = (a: string, b: string) => {
      const l1 = luminancia(parsear(a))
      const l2 = luminancia(parsear(b))
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }

    for (let paso = 0; paso <= 100; paso += 1) {
      const color = colorCielo(paso / 100)
      expect(contraste(color.fg, color.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contraste(color.dim, color.bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
