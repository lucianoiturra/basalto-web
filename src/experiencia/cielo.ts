type RGB = [number, number, number]

type Keyframe = [progreso: number, bg: RGB, fg: RGB, dim: RGB]

const KEYFRAMES: Keyframe[] = [
  [0, [239, 233, 221], [38, 36, 30], [135, 127, 110]],
  [0.16, [234, 222, 198], [42, 36, 24], [131, 122, 104]],
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

  const mezclar = (indice: 1 | 2 | 3): string => {
    const desde = anterior[indice]
    const hasta = proximo[indice]
    return rgb(
      desde.map((valor, canal) =>
        Math.round(valor + (hasta[canal] - valor) * t),
      ) as RGB,
    )
  }

  return { bg: mezclar(1), fg: mezclar(2), dim: mezclar(3) }
}
