type RGB = [number, number, number]

type Keyframe = [progreso: number, bg: RGB, fg: RGB, dim: RGB]

const KEYFRAMES: Keyframe[] = [
  [0, [239, 233, 221], [38, 36, 30], [110, 102, 88]],
  [0.16, [234, 222, 198], [42, 36, 24], [105, 96, 80]],
  [0.42, [58, 52, 44], [237, 231, 218], [167, 159, 144]],
  [0.62, [29, 28, 24], [234, 229, 219], [156, 151, 140]],
  [1, [14, 15, 13], [232, 228, 220], [143, 139, 131]],
]

export interface ColoresCielo {
  bg: string
  fg: string
  dim: string
}

const rgb = (valor: RGB) => `rgb(${valor[0]},${valor[1]},${valor[2]})`

const luminancia = (valor: RGB) => {
  const canales = valor.map((canal) => {
    const normalizado = canal / 255
    return normalizado <= 0.04045
      ? normalizado / 12.92
      : ((normalizado + 0.055) / 1.055) ** 2.4
  })
  return canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722
}

const contraste = (a: RGB, b: RGB) => {
  const l1 = luminancia(a)
  const l2 = luminancia(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const asegurarContraste = (texto: RGB, fondo: RGB): RGB => {
  if (contraste(texto, fondo) >= 4.5) return texto
  const oscuro: RGB = [0, 0, 0]
  const claro: RGB = [255, 255, 255]
  return contraste(oscuro, fondo) >= contraste(claro, fondo) ? oscuro : claro
}

export function colorCielo(progreso: number): ColoresCielo {
  const p = Math.max(0, Math.min(1, progreso))

  if (p === 0) {
    return {
      bg: rgb(KEYFRAMES[0][1]),
      fg: rgb(KEYFRAMES[0][2]),
      dim: rgb(KEYFRAMES[0][3]),
    }
  }

  let siguiente = 1
  while (siguiente < KEYFRAMES.length - 1 && KEYFRAMES[siguiente][0] < p) {
    siguiente += 1
  }

  const anterior = KEYFRAMES[siguiente - 1]
  const proximo = KEYFRAMES[siguiente]
  const t = Math.max(0, Math.min(1, (p - anterior[0]) / (proximo[0] - anterior[0])))

  const mezclar = (indice: 1 | 2 | 3): RGB => {
    const desde = anterior[indice]
    const hasta = proximo[indice]
    return desde.map((valor, canal) =>
      Math.round(valor + (hasta[canal] - valor) * t),
    ) as RGB
  }

  const fondo = mezclar(1)
  return {
    bg: rgb(fondo),
    fg: rgb(asegurarContraste(mezclar(2), fondo)),
    dim: rgb(asegurarContraste(mezclar(3), fondo)),
  }
}
