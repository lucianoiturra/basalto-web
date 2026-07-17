'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Casa, Medio } from '@/payload-types'

import {
  aViewBox,
  type MuroJSON,
  type RecintoJSON,
} from './escala'
import s from './experiencia.module.css'

const esPunto = (valor: unknown): valor is [number, number] =>
  Array.isArray(valor) &&
  valor.length === 2 &&
  valor.every((coordenada) => typeof coordenada === 'number')

const esMuro = (valor: unknown): valor is MuroJSON => {
  if (!valor || typeof valor !== 'object') return false
  const muro = valor as Partial<MuroJSON>
  return (
    esPunto(muro.de) &&
    esPunto(muro.a) &&
    (muro.grosor === undefined || typeof muro.grosor === 'number')
  )
}

type RecintoCasa = NonNullable<
  NonNullable<NonNullable<Casa['momentos']>['plano']>['recintos']
>[number]

const esRecinto = (recinto: RecintoCasa): recinto is RecintoCasa & RecintoJSON =>
  Array.isArray(recinto.poligono) &&
  recinto.poligono.length >= 3 &&
  recinto.poligono.every(esPunto)

const comoMedio = (valor: number | Medio | null | undefined): Medio | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

export function Planta({ casa }: { casa: Casa }) {
  const plano = casa.momentos?.plano
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dibujado, setDibujado] = useState(false)
  const datos = useMemo(() => {
    const muros = Array.isArray(plano?.muros) ? plano.muros.filter(esMuro) : []
    const recintos = (plano?.recintos ?? []).filter(esRecinto)
    return {
      recintos,
      plano: muros.length && recintos.length ? aViewBox(muros, recintos) : null,
    }
  }, [plano])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || typeof IntersectionObserver === 'undefined') {
      setDibujado(true)
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setDibujado(true)
          observador.disconnect()
        }
      },
      { rootMargin: '-20%' },
    )
    observador.observe(svg)
    return () => observador.disconnect()
  }, [datos.plano])

  if (!datos.plano) return null

  const elegido = seleccion === null ? null : datos.recintos[seleccion]
  const render = comoMedio(elegido?.render)
  const urlRender = render?.sizes?.pantalla?.url ?? render?.url

  const elegir = (indice: number) => setSeleccion(indice)

  return (
    <>
      <div className={s.planta}>
        <svg
          ref={svgRef}
          viewBox={datos.plano.viewBox}
          className={dibujado ? s.dibujado : ''}
          role="group"
          aria-label={`Planta de ${casa.nombre}. Toca un recinto para verlo terminado.`}
        >
          {datos.plano.segmentos.map((muro, indice) => (
            <line
              key={indice}
              className={s.muro}
              x1={muro.x1}
              y1={muro.y1}
              x2={muro.x2}
              y2={muro.y2}
              strokeWidth={
                muro.grosor < 1 ? Math.max(1.1, muro.grosor * 18) : muro.grosor
              }
              pathLength={1}
            />
          ))}
          {datos.plano.poligonos.map((poligono, indice) => (
            <polygon
              key={`${poligono.nombre}-${indice}`}
              points={poligono.puntos}
              className={`${s.recinto} ${seleccion === indice ? s.sel : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={seleccion === indice}
              aria-label={`${poligono.nombre}, ${poligono.superficie.toLocaleString(
                'es-CL',
              )} metros cuadrados`}
              onClick={() => elegir(indice)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault()
                  elegir(indice)
                }
              }}
            />
          ))}
          {datos.plano.poligonos.map((poligono, indice) => (
            <text
              key={`${poligono.nombre}-etiqueta-${indice}`}
              x={poligono.centro[0]}
              y={poligono.centro[1] - 2}
              className={s.etiqueta}
              textAnchor="middle"
              aria-hidden="true"
            >
              {poligono.nombre}
              <tspan x={poligono.centro[0]} dy="8">
                {poligono.superficie.toLocaleString('es-CL')} M²
              </tspan>
            </text>
          ))}
        </svg>
        <div className={`mono ${s.planCap}`}>
          <span>PLANTA GENERAL · {casa.specs.superficie} M²</span>
          <span>LÁMINA A1.1 INCLUIDA</span>
        </div>
      </div>
      <div
        className={`${s.reveal} ${urlRender ? s.abierto : ''}`}
        aria-hidden={!urlRender}
      >
        {urlRender ? (
          <Image
            src={urlRender}
            alt={render?.alt ?? elegido?.nombre ?? ''}
            fill
            sizes="100vw"
            quality={60}
          />
        ) : null}
        {elegido && urlRender ? (
          <div className={s.rmeta}>
            <b className="mono">{elegido.nombre}</b>
            <span className="mono">
              {elegido.superficie.toLocaleString('es-CL')} M²
            </span>
          </div>
        ) : null}
      </div>
      <p className={s.rtxt} aria-live="polite">
        {elegido?.frase ??
          'Toca un recinto del plano y aparece aquí, terminado.'}
      </p>
    </>
  )
}
