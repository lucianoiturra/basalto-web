import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { Lienzo } from '@/experiencia/Lienzo'
import { Maqueta } from '@/experiencia/Maqueta'
import { Planta } from '@/experiencia/Planta'
import { Portada } from '@/experiencia/Portada'
import { Prueba } from '@/experiencia/Prueba'
import { Decide } from '@/experiencia/Decide'
import { Visita } from '@/experiencia/Visita'
import type { Casa } from '@/payload-types'

import s from '@/experiencia/experiencia.module.css'

export const revalidate = 300

export type CasaCompleta = Casa

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const resultado = await payload.find({
    collection: 'casas',
    depth: 0,
    limit: 100,
    pagination: false,
    where: { publicada: { equals: true } },
  })

  return resultado.docs.flatMap((casa) =>
    casa.slug ? [{ slug: casa.slug }] : [],
  )
}

export default async function PaginaCasa({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const resultado = await payload.find({
    collection: 'casas',
    depth: 2,
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { publicada: { equals: true } }],
    },
  })
  const casa = resultado.docs[0]

  if (!casa) notFound()

  return (
    <Lienzo>
      <Portada casa={casa} />
      {casa.momentos?.visita?.length ? (
        <>
          <div className="mom">17:00 · LA CAMINAS</div>
          <div className="flow">
            <p>
              Sigue bajando sin soltar: cada paso te lleva a un lugar de la casa. El
              punto del plano te dice dónde estás.
            </p>
          </div>
          <Visita casa={casa} />
        </>
      ) : null}
      {casa.momentos?.plano?.recintos?.length ? (
        <>
          <div className="mom">18:30 · LEES EL PLANO</div>
          <div className="flow">
            <h2>Lo que caminaste, ahora dibujado</h2>
            <p>
              Toca cada lugar para entender cuánto mide y cómo se siente terminado.
            </p>
          </div>
          <Planta casa={casa} />
        </>
      ) : null}
      {typeof casa.momentos?.maqueta?.glb === 'object' &&
      casa.momentos.maqueta.glb?.url ? (
        <>
          <div className="mom">19:30 · EL SOL SE PONE</div>
          <div className="flow">
            <h2>El mismo sol, en cada estación</h2>
            <p>
              Carga la maqueta solo si quieres. Después mueve la hora y descubre
              dónde cae la sombra antes de construir.
            </p>
          </div>
          <Maqueta casa={casa} />
        </>
      ) : null}
      {casa.momentos?.fotosObra?.length ? <Prueba casa={casa} /> : null}
      <Decide casa={casa} />
      <footer className={s.pie}>
        BASALTO ARQUITECTURA
        <br />
        CASAS PARA EL SUR DE CHILE
      </footer>
    </Lienzo>
  )
}
