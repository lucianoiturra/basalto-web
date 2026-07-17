import * as SunCalc from 'suncalc'

export type Estacion = 'verano' | 'otono' | 'invierno' | 'primavera'

const FECHAS: Record<Estacion, string> = {
  verano: '-01-15',
  otono: '-04-15',
  invierno: '-07-15',
  primavera: '-10-15',
}

export function posicionSol(
  estacion: Estacion,
  hora: number,
  lat: number,
  lng: number,
) {
  const fecha = new Date(`${new Date().getFullYear()}${FECHAS[estacion]}T00:00:00-03:00`)
  fecha.setUTCHours(
    fecha.getUTCHours() + Math.floor(hora),
    Math.round((hora % 1) * 60),
  )
  const posicion = SunCalc.getPosition(fecha, lat, lng)

  return { azimut: posicion.azimuth, elevacion: posicion.altitude }
}

export function direccionLuz(
  estacion: Estacion,
  hora: number,
  lat: number,
  lng: number,
): [number, number, number] {
  const { azimut, elevacion } = posicionSol(estacion, hora, lat, lng)

  return [
    Math.cos(elevacion) * Math.sin(azimut),
    Math.sin(elevacion),
    Math.cos(elevacion) * Math.cos(azimut),
  ]
}
