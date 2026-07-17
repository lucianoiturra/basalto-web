'use client'

import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'

import { colorCielo } from './cielo'
import s from './experiencia.module.css'

const PASOS_REDUCIDOS = [0, 0.16, 0.42, 0.62, 1]

const progresoDiscreto = (progreso: number) =>
  PASOS_REDUCIDOS.reduce((mejor, paso) =>
    Math.abs(paso - progreso) < Math.abs(mejor - progreso) ? paso : mejor,
  )

export function Lienzo({ children }: { children: ReactNode }) {
  const walker = useRef<HTMLDivElement>(null)
  const hora = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const actualizar = () => {
      frame = 0
      const maximo = document.documentElement.scrollHeight - window.innerHeight
      const progreso = maximo > 0 ? Math.max(0, Math.min(1, window.scrollY / maximo)) : 0
      const color = colorCielo(
        reduceMotion.matches ? progresoDiscreto(progreso) : progreso,
      )
      const root = document.documentElement.style

      root.setProperty('--bg', color.bg)
      root.setProperty('--fg', color.fg)
      root.setProperty('--dim', color.dim)
      document.body.dataset.progreso = String(Math.round(progreso * 100))

      if (walker.current) walker.current.style.top = `${8 + progreso * 84}vh`

      const horaDecimal = 16 + progreso * 6.5
      const horas = Math.floor(horaDecimal)
      const minutos = Math.floor((horaDecimal % 1) * 60)
      if (hora.current) {
        hora.current.textContent = `${String(horas).padStart(2, '0')}:${String(
          minutos,
        ).padStart(2, '0')}`
      }
    }

    const solicitarActualizacion = () => {
      if (!frame) frame = window.requestAnimationFrame(actualizar)
    }

    actualizar()
    window.addEventListener('scroll', solicitarActualizacion, { passive: true })
    window.addEventListener('resize', solicitarActualizacion)
    reduceMotion.addEventListener('change', solicitarActualizacion)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', solicitarActualizacion)
      window.removeEventListener('resize', solicitarActualizacion)
      reduceMotion.removeEventListener('change', solicitarActualizacion)
      delete document.body.dataset.progreso
      const root = document.documentElement.style
      root.removeProperty('--bg')
      root.removeProperty('--fg')
      root.removeProperty('--dim')
    }
  }, [])

  return (
    <main className={s.lienzo}>
      <header className={s.top}>
        <Link href="/" aria-label="Volver al inicio de Basalto">
          BASALTO
        </Link>
        <span className={s.coordenada}>CASAS PARA EL SUR</span>
      </header>
      <div className={s.hilo} aria-hidden="true" />
      <div className={s.walker} ref={walker} aria-hidden="true">
        <i />
        <b ref={hora} className="mono">
          16:00
        </b>
      </div>
      {children}
    </main>
  )
}
