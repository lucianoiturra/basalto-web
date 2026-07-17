export function validarPoligono(value: unknown): true | string {
  if (!Array.isArray(value)) {
    return 'El polígono debe ser un arreglo de puntos [[x,y],…]'
  }

  if (value.length < 3) {
    return 'El polígono necesita al menos 3 vértices'
  }

  for (const punto of value) {
    if (
      !Array.isArray(punto) ||
      punto.length !== 2 ||
      typeof punto[0] !== 'number' ||
      typeof punto[1] !== 'number' ||
      !Number.isFinite(punto[0]) ||
      !Number.isFinite(punto[1])
    ) {
      return 'Cada vértice debe ser un par de números finitos [x,y]'
    }
  }

  return true
}
