import Link from 'next/link'
import React from 'react'
import './styles.css'

export default function HomePage() {
  return (
    <main className="home">
      <div className="wordmark" aria-label="Basalto Arquitectura">
        <span aria-hidden="true">BA</span>
        <strong>BASALTO</strong>
      </div>
      <div className="message">
        <h1>Estamos preparando una nueva forma de elegir tu casa.</h1>
        <p>
          Muy pronto podrás recorrer cada proyecto, entender sus planos y descargar
          un paquete completo para construir.
        </p>
      </div>
      <Link className="adminLink" href="/admin">
        Administrar catálogo
      </Link>
    </main>
  )
}
