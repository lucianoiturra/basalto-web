import Image from 'next/image'

import type { Casa, Medio } from '@/payload-types'

import s from './experiencia.module.css'

const comoMedio = (valor: number | Medio | null | undefined): Medio | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

export function Portada({ casa }: { casa: Casa }) {
  const imagen = comoMedio(casa.momentos?.llegada?.imagen)
  const url =
    imagen?.sizes?.tarjeta?.url ?? imagen?.sizes?.pantalla?.url ?? imagen?.url

  return (
    <>
      <div className="mom">16:00 · LLEGAS</div>
      <div className="flow">
        <h1>{casa.nombre}</h1>
        {casa.momentos?.llegada?.relato ? (
          <p>{casa.momentos.llegada.relato}</p>
        ) : null}
        <div className={s.datos} aria-label="Datos principales de la casa">
          <span>CASA {casa.numero}</span>
          <span>{casa.specs.superficie} M²</span>
          <span>{casa.specs.dormitorios} DORM</span>
          <span>{casa.specs.banos} BAÑOS</span>
        </div>
      </div>
      {url ? (
        <figure className={`${s.bleed} ${s.heroimg}`}>
          <Image
            src={url}
            alt={imagen?.alt ?? casa.nombre}
            width={
              imagen?.sizes?.tarjeta?.width ??
              imagen?.sizes?.pantalla?.width ??
              imagen?.width ??
              800
            }
            height={
              imagen?.sizes?.tarjeta?.height ??
              imagen?.sizes?.pantalla?.height ??
              imagen?.height ??
              800
            }
            sizes="100vw"
            preload
            fetchPriority="high"
            quality={25}
          />
          <figcaption className={s.cap}>
            LA LLEGADA · {casa.ubicacion?.toUpperCase() ?? 'SUR DE CHILE'}
          </figcaption>
        </figure>
      ) : null}
    </>
  )
}
