import Image from 'next/image'

import type { Casa, Medio } from '@/payload-types'

import s from './experiencia.module.css'

const comoMedio = (valor: number | Medio): Medio | undefined =>
  typeof valor === 'object' && valor !== null ? valor : undefined

export function Prueba({ casa }: { casa: Casa }) {
  const foto = casa.momentos?.fotosObra?.[0]
  if (!foto) return null

  const imagen = comoMedio(foto.imagen)
  const url = imagen?.sizes?.pantalla?.url ?? imagen?.url
  if (!url) return null

  return (
    <>
      <div className="mom">21:00 · YA DE NOCHE, LA VERDAD</div>
      <div className="flow">
        <h2>Una casa real, no una promesa</h2>
        <p>
          Antes de decidir, mira el resultado: alguien construyó esta misma casa con
          estas láminas.
        </p>
      </div>
      <figure className={s.bleed}>
        <Image
          src={url}
          alt={imagen?.alt ?? `Obra construida de ${casa.nombre}`}
          width={imagen?.sizes?.pantalla?.width ?? imagen?.width ?? 1600}
          height={imagen?.sizes?.pantalla?.height ?? imagen?.height ?? 1067}
          sizes="100vw"
          quality={60}
        />
        <div className={s.over}>
          <b>OBRA REAL · {foto.fecha?.slice(-4) ?? 'CONSTRUIDA'}</b>
          <span>
            De estas láminas,
            <br />
            esta casa.
          </span>
        </div>
        <figcaption className={s.cap}>
          {(foto.lugar ?? casa.ubicacion ?? casa.nombre).toUpperCase()}
          {foto.fecha ? ` · REG. ${foto.fecha}` : ''}
        </figcaption>
      </figure>
    </>
  )
}
