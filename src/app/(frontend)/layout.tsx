import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Planos de casas claros, completos y listos para construir.',
  title: 'Basalto Arquitectura',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
