import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const archivo = Archivo({
  axes: ['wdth'],
  subsets: ['latin'],
  variable: '--font-archivo',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  description: 'Recorre casas pensadas para el sur y entiende cada plano antes de elegir.',
  title: 'Basalto — Casas para el sur de Chile',
}

export default function LayoutWeb({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
