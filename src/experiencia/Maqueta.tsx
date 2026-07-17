'use client'

import { useEffect, useRef, useState } from 'react'

import type { Casa, Medio } from '@/payload-types'

import { direccionLuz, posicionSol, type Estacion } from './sol'
import type { Visor3D } from './visor3d'
import s from './experiencia.module.css'

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'cargando'; progreso: number }
  | { tipo: 'listo' }
  | { tipo: 'error' }

const estaciones: { valor: Estacion; etiqueta: string }[] = [
  { valor: 'verano', etiqueta: 'Verano' },
  { valor: 'otono', etiqueta: 'Otoño' },
  { valor: 'invierno', etiqueta: 'Invierno' },
  { valor: 'primavera', etiqueta: 'Primavera' },
]

const comoMedio = (valor: number | Medio | null | undefined): Medio | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

const formatearHora = (hora: number) => {
  const horas = Math.floor(hora)
  const minutos = Math.round((hora % 1) * 60)
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

export function Maqueta({ casa }: { casa: Casa }) {
  const glb = comoMedio(casa.momentos?.maqueta?.glb)
  const llegada = comoMedio(casa.momentos?.llegada?.imagen)
  const urlPoster = llegada?.sizes?.pantalla?.url ?? llegada?.url
  const holder = useRef<HTMLDivElement>(null)
  const visor = useRef<Visor3D | null>(null)
  const montado = useRef(true)
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' })
  const [hora, setHora] = useState(15)
  const [estacion, setEstacion] = useState<Estacion>('verano')
  const lat = casa.coordenadas?.lat ?? -38.98
  const lng = casa.coordenadas?.lng ?? -72.65

  const cargar = async () => {
    if (!holder.current || !glb?.url || estado.tipo !== 'inactivo') return
    setEstado({ tipo: 'cargando', progreso: 0 })

    try {
      const { crearVisor } = await import('./visor3d')
      const nuevoVisor = await crearVisor(
        holder.current,
        glb.url,
        (progreso) =>
          montado.current && setEstado({ tipo: 'cargando', progreso }),
      )

      if (!montado.current) {
        nuevoVisor.destruir()
        return
      }
      visor.current = nuevoVisor
      setEstado({ tipo: 'listo' })
    } catch {
      if (montado.current) setEstado({ tipo: 'error' })
    }
  }

  useEffect(() => {
    return () => {
      montado.current = false
      visor.current?.destruir()
      visor.current = null
    }
  }, [])

  useEffect(() => {
    if (estado.tipo !== 'listo' || !visor.current) return
    const posicion = posicionSol(estacion, hora, lat, lng)
    visor.current.fijarSol(
      direccionLuz(estacion, hora, lat, lng),
      Math.sin(posicion.elevacion),
    )
  }, [estado.tipo, estacion, hora, lat, lng])

  useEffect(() => {
    if (estado.tipo !== 'listo') return
    let frame = 0
    let ultima = 0

    const sincronizar = (tiempo: number) => {
      if (tiempo - ultima >= 1000) {
        ultima = tiempo
        const fondo = getComputedStyle(document.documentElement)
          .getPropertyValue('--bg')
          .trim()
        visor.current?.fijarFondo(fondo)
      }
      frame = window.requestAnimationFrame(sincronizar)
    }

    frame = window.requestAnimationFrame(sincronizar)
    return () => window.cancelAnimationFrame(frame)
  }, [estado.tipo])

  if (!glb?.url) return null

  const tamano = glb.filesize ? `${Math.max(1, Math.round(glb.filesize / 1e6))} MB` : '3D'
  const listo = estado.tipo === 'listo'

  return (
    <>
      <div
        ref={holder}
        className={`${s.viewer} ${listo ? s.listo : ''}`}
        aria-busy={estado.tipo === 'cargando'}
      >
        {urlPoster ? (
          <img
            className={s.poster}
            src={urlPoster}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        ) : null}
        {!listo ? (
          <div className={s.vcenter}>
            {estado.tipo === 'inactivo' ? (
              <>
                <button type="button" className={s.load3d} onClick={cargar}>
                  Cargar la maqueta 3D
                </button>
                <span className={s.vnote}>
                  MODELO REAL · {tamano} · SOLO SI TÚ QUIERES
                </span>
              </>
            ) : null}
            {estado.tipo === 'cargando' ? (
              <span className={s.vload} role="status">
                CARGANDO MAQUETA… {estado.progreso}%
              </span>
            ) : null}
            {estado.tipo === 'error' ? (
              <p className={s.verror} role="alert">
                No pudimos cargar la maqueta aquí — mira la galería y el plano.
              </p>
            ) : null}
          </div>
        ) : null}
        {listo ? (
          <>
            <div className={s.vclock}>{formatearHora(hora)}</div>
            <div className={s.v3hint}>
              GIRA CON EL DEDO · PELLIZCA PARA ACERCAR
            </div>
          </>
        ) : null}
      </div>
      <div className={s.sunctl}>
        <label className={s.srOnly} htmlFor={`hora-sol-${casa.id}`}>
          Hora del día en la maqueta
        </label>
        <input
          id={`hora-sol-${casa.id}`}
          className={s.sunSlider}
          type="range"
          min="7"
          max="20"
          step="0.25"
          value={hora}
          disabled={!listo}
          onChange={(evento) => setHora(Number(evento.target.value))}
        />
        <p className={s.hint}>ARRASTRA EL SOL · LA SOMBRA ES REAL</p>
        <div className={s.seasons} aria-label="Estación del año">
          {estaciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={estacion === opcion.valor ? s.activa : ''}
              aria-pressed={estacion === opcion.valor}
              disabled={!listo}
              onClick={() => setEstacion(opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
