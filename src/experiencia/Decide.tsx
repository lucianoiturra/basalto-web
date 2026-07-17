'use client'

import { useEffect, useState } from 'react'

import type { Casa } from '@/payload-types'

import s from './experiencia.module.css'

const clp = (valor: number) => `$${valor.toLocaleString('es-CL')}`

export function Decide({ casa }: { casa: Casa }) {
  const [visible, setVisible] = useState(false)
  const precio = casa.precioOferta ?? casa.precio

  useEffect(() => {
    const actualizar = () =>
      setVisible(Number(document.body.dataset.progreso ?? 0) > 78)
    const observador = new MutationObserver(actualizar)
    observador.observe(document.body, {
      attributeFilter: ['data-progreso'],
      attributes: true,
    })
    actualizar()
    return () => observador.disconnect()
  }, [])

  const comprar = () => {
    window.dispatchEvent(
      new CustomEvent('basalto:comprar', {
        detail: { casaId: casa.id },
      }),
    )
  }

  return (
    <>
      <div className="mom" id="decide">
        22:00 · LA DECIDES
      </div>
      <div className={s.ficha}>
        <div>
          <b className="mono">SUPERFICIE</b>
          <span>{casa.specs.superficie} m²</span>
        </div>
        <div>
          <b className="mono">DORMITORIOS / BAÑOS</b>
          <span>
            {casa.specs.dormitorios} / {casa.specs.banos}
          </span>
        </div>
        <div>
          <b className="mono">LÁMINAS</b>
          <span>{casa.paquete?.laminas ?? '—'} PDF listas para el permiso</span>
        </div>
        {casa.paquete?.incluyeDwg ? (
          <div>
            <b className="mono">EDITABLES</b>
            <span>DWG para tu constructor</span>
          </div>
        ) : null}
        {casa.paquete?.incluyeEett ? (
          <div>
            <b className="mono">ESPECIFICACIONES</b>
            <span>EETT partida por partida</span>
          </div>
        ) : null}
        <div>
          <b className="mono">ENTREGA</b>
          <span>Inmediata, a tu correo</span>
        </div>
      </div>
      <div className={s.decide}>
        <div className={s.pr}>
          {casa.precioOferta ? <s className="mono">{clp(casa.precio)}</s> : null}
          <em className="mono">{clp(precio)}</em>
          <u>CLP</u>
        </div>
        <button
          type="button"
          className={s.btn}
          onClick={comprar}
          title="Muy pronto"
        >
          Comprar los planos
        </button>
        <p className={s.nota}>
          Pago con Mercado Pago · Ajustes menores opcionales · La descarga no caduca
        </p>
      </div>
      <div
        className={`${s.barra} ${visible ? s.mostrar : ''}`}
        aria-hidden={!visible}
      >
        <div className="mono">
          {clp(precio)}
          <small>
            CASA {casa.numero} · {casa.nombre.toUpperCase()}
          </small>
        </div>
        <button type="button" onClick={comprar} title="Muy pronto" tabIndex={visible ? 0 : -1}>
          Comprar los planos
        </button>
      </div>
    </>
  )
}
