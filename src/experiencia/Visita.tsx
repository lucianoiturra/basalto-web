'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Casa, Medio } from '@/payload-types'

import { aViewBox, type MuroJSON } from './escala'
import s from './experiencia.module.css'

const comoMedio = (valor: number | Medio): Medio | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

const esPunto = (valor: unknown): valor is [number, number] =>
  Array.isArray(valor) &&
  valor.length === 2 &&
  valor.every((coordenada) => typeof coordenada === 'number')

const esMuro = (valor: unknown): valor is MuroJSON => {
  if (!valor || typeof valor !== 'object') return false
  const muro = valor as Partial<MuroJSON>
  return esPunto(muro.de) && esPunto(muro.a)
}

export function Visita({ casa }: { casa: Casa }) {
  const escenas = casa.momentos?.visita ?? []
  const contenedor = useRef<HTMLElement>(null)
  const [activa, setActiva] = useState(0)
  const mapa = useMemo(() => {
    const muros = casa.momentos?.plano?.muros
    if (!Array.isArray(muros)) return null
    const validos = muros.filter(esMuro)
    return validos.length
      ? aViewBox(validos, [], { escala: 5, margen: 4 })
      : null
  }, [casa.momentos?.plano?.muros])

  useEffect(() => {
    let frame = 0

    const actualizar = () => {
      frame = 0
      const elemento = contenedor.current
      if (!elemento || escenas.length === 0) return

      const inicio = elemento.getBoundingClientRect().top + window.scrollY
      const recorrido = elemento.offsetHeight - window.innerHeight
      const progreso =
        recorrido > 0
          ? Math.max(0, Math.min(0.999, (window.scrollY - inicio) / recorrido))
          : 0
      const indice = Math.floor(progreso * escenas.length)
      setActiva((actual) => (actual === indice ? actual : indice))
    }

    const alDesplazar = () => {
      if (!frame) frame = window.requestAnimationFrame(actualizar)
    }

    actualizar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [escenas.length])

  if (!escenas.length) return null

  return (
    <section
      ref={contenedor}
      className={s.visita}
      style={{ height: `${escenas.length * 90 + 100}svh` }}
      aria-label="Visita guiada por la casa"
    >
      <div className={s.stage}>
        {escenas.map((escena, indice) => {
          const imagen = comoMedio(escena.imagen)
          const url = imagen?.sizes?.pantalla?.url ?? imagen?.url
          if (!url) return null

          return (
            <Image
              key={escena.id ?? indice}
              src={url}
              alt={imagen?.alt ?? escena.titulo}
              className={`${s.shot} ${indice === activa ? s.on : ''}`}
              fill
              sizes="100vw"
              fetchPriority="low"
              quality={60}
            />
          )
        })}
        <div className={s.shade} aria-hidden="true" />
        <div className={s.fadeIn} aria-hidden="true" />
        <div className={s.fadeOut} aria-hidden="true" />
        {mapa ? (
          <figure className={s.minimapa}>
            <svg width="120" viewBox={mapa.viewBox} aria-hidden="true">
              {mapa.segmentos.map((muro, indice) => (
                <line
                  key={indice}
                  x1={muro.x1}
                  y1={muro.y1}
                  x2={muro.x2}
                  y2={muro.y2}
                  stroke="white"
                  strokeWidth={muro.grosor > 0.3 ? 2 : 0.7}
                />
              ))}
              <circle
                fill="var(--acc)"
                r="4"
                cx={`${escenas[activa]?.puntoX ?? 50}%`}
                cy={`${escenas[activa]?.puntoY ?? 50}%`}
              />
            </svg>
            <figcaption className="mono">ESTÁS AQUÍ</figcaption>
          </figure>
        ) : null}
        {escenas.map((escena, indice) => (
          <div
            key={escena.id ?? indice}
            className={`${s.vcap} ${indice === activa ? s.on : ''}`}
            aria-hidden={indice !== activa}
          >
            <span className={`mono ${s.k}`}>{escena.titulo.toUpperCase()}</span>
            <h2>{escena.titulo}</h2>
            <p>{escena.frase}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
