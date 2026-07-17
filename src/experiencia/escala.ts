export interface MuroJSON {
  de: [number, number]
  a: [number, number]
  grosor?: number
}

export interface RecintoJSON {
  nombre: string
  superficie: number
  poligono: [number, number][]
}

export interface SegPx {
  x1: number
  y1: number
  x2: number
  y2: number
  grosor: number
}

export interface PoligonoPx {
  puntos: string
  nombre: string
  superficie: number
  centro: [number, number]
}

export function aViewBox(
  muros: MuroJSON[],
  recintos: RecintoJSON[],
  { escala = 18, margen = 8 }: { escala?: number; margen?: number } = {},
) {
  const xs: number[] = []
  const ys: number[] = []

  for (const muro of muros) {
    xs.push(muro.de[0], muro.a[0])
    ys.push(muro.de[1], muro.a[1])
  }

  for (const recinto of recintos) {
    for (const [x, y] of recinto.poligono) {
      xs.push(x)
      ys.push(y)
    }
  }

  if (xs.length === 0 || ys.length === 0) {
    const lado = margen * 2
    return {
      viewBox: `0 0 ${lado} ${lado}`,
      segmentos: [] as SegPx[],
      poligonos: [] as PoligonoPx[],
    }
  }

  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const redondear = (valor: number) => Math.round(valor * 100) / 100
  const px = (x: number) => redondear((x - minX) * escala + margen)
  const py = (y: number) => redondear((y - minY) * escala + margen)

  const segmentos: SegPx[] = muros.map((muro) => ({
    x1: px(muro.de[0]),
    y1: py(muro.de[1]),
    x2: px(muro.a[0]),
    y2: py(muro.a[1]),
    grosor: muro.grosor ?? 1.1,
  }))

  const poligonos: PoligonoPx[] = recintos.map((recinto) => {
    const puntos = recinto.poligono.map(([x, y]) => [px(x), py(y)] as const)
    const centroX = puntos.reduce((suma, punto) => suma + punto[0], 0) / puntos.length
    const centroY = puntos.reduce((suma, punto) => suma + punto[1], 0) / puntos.length

    return {
      puntos: puntos.map((punto) => `${punto[0]},${punto[1]}`).join(' '),
      nombre: recinto.nombre,
      superficie: recinto.superficie,
      centro: [Math.round(centroX), Math.round(centroY)],
    }
  })

  const ancho = Math.round((Math.max(...xs) - minX) * escala + margen * 2)
  const alto = Math.round((Math.max(...ys) - minY) * escala + margen * 2)

  return { viewBox: `0 0 ${ancho} ${alto}`, segmentos, poligonos }
}
