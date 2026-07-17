# Basalto Web M2 — La Experiencia "Un Día en la Casa" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La página `/casas/[slug]` completa: el lienzo continuo que anochece, la visita guiada, la planta interactiva, la maqueta 3D con sol real y el cierre — mobile-first, alimentada por el CMS de M1.

**Architecture:** Server Component que trae la casa desde Payload (local API) y compone los momentos; los componentes interactivos son client components con carga diferida (three.js solo bajo demanda). La lógica pura (colores del cielo, escala del plano, posición solar) vive en módulos testeados con Vitest.

**Tech Stack:** Next.js App Router, React 19, CSS Modules + variables CSS, `suncalc`, three.js (GLTFLoader + DRACOLoader + OrbitControls), next/font (Archivo + IBM Plex Mono).

**Referencia visual obligatoria:** `docs/superpowers/referencias/mockup-v8-un-dia-en-la-casa.html` — TODOS los valores de diseño (colores, tipografía, espaciados, easings, textos de ejemplo) salen de ahí. Ante cualquier duda visual, abrir ese archivo en el navegador y replicarlo.

**Prerequisito:** M1 completo (colección `casas` poblada con Pitrufquén, tag `m1-base`).

## Global Constraints

- Mobile-first: diseñar a 390 px; desktop = mismo lienzo centrado (max-width 480 px para el flujo de texto, imágenes a sangre completa).
- Un solo acento: terracota `#C2552E`. Cielo por keyframes (Task 2). Tipos: Archivo (display `font-stretch:125%` peso 800 en mayúsculas) + IBM Plex Mono para horas/cifras/códigos.
- three.js se importa SOLO con dynamic import tras tocar "Cargar la maqueta 3D".
- `prefers-reduced-motion`: sin Ken Burns ni parallax; cielo cambia por pasos discretos.
- Degradación por contenido (spec §2): sin GLB → sin momento 19:30; sin fotosObra → sin 21:00; recinto sin render → solo texto.
- Textos siempre en segunda persona, sin jerga; los del mockup v8 son la referencia de tono.

## File Structure

```
src/app/(web)/layout.tsx              (fuentes, CSS global, <html lang="es">)
src/app/(web)/globals.css             (reset, variables, clases compartidas)
src/app/(web)/casas/[slug]/page.tsx   (RSC: fetch + composición de momentos)
src/experiencia/
├─ cielo.ts            (PURO: colorCielo(p) — keyframes tarde→noche)
├─ escala.ts           (PURO: aViewBox(muros, recintos) metros→px)
├─ sol.ts              (PURO: posicionSol(estacion, hora, lat, lng))
├─ Lienzo.tsx          (client: scroll → variables CSS + hilo con la hora)
├─ Portada.tsx         (16:00 — imagen fundida + título + datos)
├─ Visita.tsx          (client: 17:00 — scrollytelling + minimapa)
├─ Planta.tsx          (client: 18:30 — SVG interactivo + reveal)
├─ Maqueta.tsx         (client: 19:30 — visor three + slider sol/estación)
├─ visor3d.ts          (client: setup three, importado dinámico por Maqueta)
├─ Prueba.tsx          (21:00 — obra real)
└─ Decide.tsx          (client: 22:00 — ficha, precio, barra fija)
tests/cielo.test.ts, tests/escala.test.ts, tests/sol.test.ts
```

---

### Task 1: Layout web, fuentes y CSS base

**Files:**
- Create: `src/app/(web)/layout.tsx`, `src/app/(web)/globals.css`
- Modify: (nada de Payload)

**Interfaces:**
- Produces: grupo de rutas `(web)` con `<html lang="es">`, fuentes `--font-archivo` y `--font-mono`, clases globales `.mom`, `.flow`, variables por defecto `--bg/--fg/--dim/--acc`.

- [ ] **Step 1: Layout con next/font**

`src/app/(web)/layout.tsx`:

```tsx
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', axes: ['wdth'] })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata = { title: 'Basalto — Casas para el sur de Chile' }

export default function LayoutWeb({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: CSS global (valores del mockup v8)**

`src/app/(web)/globals.css`:

```css
* { box-sizing: border-box; margin: 0; }
:root { --acc: #C2552E; }
body {
  font-family: var(--font-archivo), sans-serif;
  background: var(--bg, #EFE9DD);
  color: var(--fg, #26241E);
}
.mono { font-family: var(--font-mono), monospace; }
.mom { display: flex; align-items: center; gap: 10px; margin: 78px 20px 16px 34px;
       font: 500 9px/1 var(--font-mono); letter-spacing: .26em; color: var(--dim, #877F6E); }
.mom::before { content: ''; width: 18px; height: 1px; background: var(--dim); margin-left: -28px; }
.flow { margin: 0 20px 0 34px; max-width: 480px; }
.flow h1 { font-weight: 800; font-stretch: 125%; text-transform: uppercase;
           font-size: clamp(42px, 11vw, 64px); line-height: .95; margin-bottom: 14px; }
.flow p { font-size: 14.5px; line-height: 1.65; color: var(--dim); margin-bottom: 14px; max-width: 300px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Verificar**

Run: `npm run dev` → crear `src/app/(web)/page.tsx` provisional con `<h1 className="flow">Basalto</h1>`, abrir `/`.
Expected: fondo hueso `#EFE9DD`, título en Archivo expandida.

- [ ] **Step 4: Commit**

```bash
git add src/app
git commit -m "M2: layout web con fuentes Archivo/Plex Mono y CSS base"
```

---

### Task 2: `cielo.ts` — el color del día (TDD)

**Files:**
- Create: `src/experiencia/cielo.ts`
- Test: `tests/cielo.test.ts`

**Interfaces:**
- Produces: `colorCielo(p: number): { bg: string; fg: string; dim: string }` con `p ∈ [0,1]` (progreso de scroll) devolviendo `rgb(r,g,b)`. Keyframes exactos del mockup v8.

- [ ] **Step 1: Test que falla**

`tests/cielo.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { colorCielo } from '../src/experiencia/cielo'

describe('colorCielo', () => {
  it('p=0 es la tarde clara', () => {
    expect(colorCielo(0).bg).toBe('rgb(239,233,221)')
    expect(colorCielo(0).fg).toBe('rgb(38,36,30)')
  })
  it('p=1 es la noche', () => {
    expect(colorCielo(1).bg).toBe('rgb(14,15,13)')
    expect(colorCielo(1).fg).toBe('rgb(232,228,220)')
  })
  it('interpola entre keyframes', () => {
    const medio = colorCielo(0.08) // mitad entre 0 y 0.16
    expect(medio.bg).toBe('rgb(237,228,210)') // promedio de [239,233,221] y [234,222,198]
  })
  it('clampa fuera de rango', () => {
    expect(colorCielo(-1).bg).toBe(colorCielo(0).bg)
    expect(colorCielo(2).bg).toBe(colorCielo(1).bg)
  })
})
```

- [ ] **Step 2: Verificar que falla** — Run: `npm test` → FAIL "Cannot find module".

- [ ] **Step 3: Implementar**

`src/experiencia/cielo.ts`:

```ts
type RGB = [number, number, number]
const K: [number, RGB, RGB, RGB][] = [
  [0.00, [239, 233, 221], [38, 36, 30], [135, 127, 110]],
  [0.16, [234, 222, 198], [42, 36, 24], [131, 122, 104]],
  [0.42, [58, 52, 44], [237, 231, 218], [167, 159, 144]],
  [0.62, [29, 28, 24], [234, 229, 219], [156, 151, 140]],
  [1.00, [14, 15, 13], [232, 228, 220], [143, 139, 131]],
]

export function colorCielo(p: number): { bg: string; fg: string; dim: string } {
  const c = Math.max(0, Math.min(1, p))
  let i = 1
  while (i < K.length - 1 && K[i][0] < c) i++
  const t = (c - K[i - 1][0]) / (K[i][0] - K[i - 1][0])
  const mix = (k: 1 | 2 | 3): string => {
    const a = K[i - 1][k], b = K[i][k]
    const v = a.map((x, j) => Math.round(x + (b[j] - x) * Math.max(0, Math.min(1, t))))
    return `rgb(${v[0]},${v[1]},${v[2]})`
  }
  return { bg: mix(1), fg: mix(2), dim: mix(3) }
}
```

- [ ] **Step 4: Verificar que pasa** — Run: `npm test` → PASS (4 tests nuevos).

- [ ] **Step 5: Commit**

```bash
git add src/experiencia/cielo.ts tests/cielo.test.ts
git commit -m "M2: colorCielo con keyframes tarde-noche (TDD)"
```

---

### Task 3: `escala.ts` — del plano en metros al SVG (TDD)

**Files:**
- Create: `src/experiencia/escala.ts`
- Test: `tests/escala.test.ts`

**Interfaces:**
- Consumes: formato JSON de `casas.momentos.plano` (M1 Task 5): muros `[{de:[x,y], a:[x,y], grosor?}]`, recintos con `poligono: [[x,y],…]` — todo en metros.
- Produces: `aViewBox(muros, recintos, opciones?) → { viewBox: string, segmentos: SegPx[], poligonos: PoligonoPx[] }` con `SegPx = { x1,y1,x2,y2, grosor }` y `PoligonoPx = { puntos: string, nombre, superficie, centro: [number, number] }` (puntos listos para el atributo `points` de `<polygon>`).

- [ ] **Step 1: Test que falla**

`tests/escala.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { aViewBox } from '../src/experiencia/escala'

const muros = [
  { de: [0, 0] as [number, number], a: [10, 0] as [number, number], grosor: 3 },
  { de: [10, 0] as [number, number], a: [10, 5] as [number, number] },
]
const recintos = [{ nombre: 'COCINA', superficie: 14.27, poligono: [[0, 0], [10, 0], [10, 5], [0, 5]] as [number, number][] }]

describe('aViewBox', () => {
  it('escala 18 px/metro con margen 8', () => {
    const r = aViewBox(muros, recintos)
    expect(r.viewBox).toBe('0 0 196 106') // 10m*18 + 2*8 = 196; 5m*18 + 2*8 = 106
    expect(r.segmentos[0]).toEqual({ x1: 8, y1: 8, x2: 188, y2: 8, grosor: 3 })
    expect(r.segmentos[1].grosor).toBe(1.1) // grosor por defecto
  })
  it('poligonos con puntos SVG y centro', () => {
    const r = aViewBox(muros, recintos)
    expect(r.poligonos[0].puntos).toBe('8,8 188,8 188,98 8,98')
    expect(r.poligonos[0].centro).toEqual([98, 53])
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/experiencia/escala.ts`:

```ts
export interface MuroJSON { de: [number, number]; a: [number, number]; grosor?: number }
export interface RecintoJSON { nombre: string; superficie: number; poligono: [number, number][] }
export interface SegPx { x1: number; y1: number; x2: number; y2: number; grosor: number }
export interface PoligonoPx { puntos: string; nombre: string; superficie: number; centro: [number, number] }

export function aViewBox(
  muros: MuroJSON[],
  recintos: RecintoJSON[],
  { escala = 18, margen = 8 }: { escala?: number; margen?: number } = {},
) {
  const xs: number[] = [], ys: number[] = []
  for (const m of muros) { xs.push(m.de[0], m.a[0]); ys.push(m.de[1], m.a[1]) }
  for (const r of recintos) for (const [x, y] of r.poligono) { xs.push(x); ys.push(y) }
  const minX = Math.min(...xs), minY = Math.min(...ys)
  const px = (x: number) => Math.round(((x - minX) * escala + margen) * 100) / 100
  const py = (y: number) => Math.round(((y - minY) * escala + margen) * 100) / 100

  const segmentos: SegPx[] = muros.map((m) => ({
    x1: px(m.de[0]), y1: py(m.de[1]), x2: px(m.a[0]), y2: py(m.a[1]), grosor: m.grosor ?? 1.1,
  }))
  const poligonos: PoligonoPx[] = recintos.map((r) => {
    const pts = r.poligono.map(([x, y]) => [px(x), py(y)] as const)
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    return {
      puntos: pts.map((p) => `${p[0]},${p[1]}`).join(' '),
      nombre: r.nombre, superficie: r.superficie, centro: [Math.round(cx), Math.round(cy)],
    }
  })
  const ancho = Math.round((Math.max(...xs) - minX) * escala + margen * 2)
  const alto = Math.round((Math.max(...ys) - minY) * escala + margen * 2)
  return { viewBox: `0 0 ${ancho} ${alto}`, segmentos, poligonos }
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiencia/escala.ts tests/escala.test.ts
git commit -m "M2: escala del plano metros a SVG (TDD)"
```

---

### Task 4: `sol.ts` — posición solar real (TDD)

**Files:**
- Create: `src/experiencia/sol.ts`
- Test: `tests/sol.test.ts`

**Interfaces:**
- Produces: `type Estacion = 'verano'|'otono'|'invierno'|'primavera'`; `posicionSol(estacion, hora, lat, lng) → { azimut, elevacion }` (radianes, convención SunCalc); `direccionLuz(estacion, hora, lat, lng) → [x,y,z]` vector unitario para posicionar la DirectionalLight.

- [ ] **Step 1: Instalar y test que falla**

```powershell
npm install suncalc && npm install -D @types/suncalc
```

`tests/sol.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { posicionSol, direccionLuz } from '../src/experiencia/sol'

const LAT = -38.98, LNG = -72.65

describe('posicionSol (sur de Chile)', () => {
  it('el sol de invierno al mediodía anda más bajo que el de verano', () => {
    const inv = posicionSol('invierno', 13, LAT, LNG).elevacion
    const ver = posicionSol('verano', 13, LAT, LNG).elevacion
    expect(inv).toBeGreaterThan(0)
    expect(ver).toBeGreaterThan(inv)
  })
  it('a medianoche la elevación es negativa', () => {
    expect(posicionSol('verano', 0, LAT, LNG).elevacion).toBeLessThan(0)
  })
  it('direccionLuz da un vector unitario con y = sin(elevacion)', () => {
    const [x, y, z] = direccionLuz('verano', 13, LAT, LNG)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5)
    expect(y).toBeCloseTo(Math.sin(posicionSol('verano', 13, LAT, LNG).elevacion), 5)
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/experiencia/sol.ts`:

```ts
import SunCalc from 'suncalc'

export type Estacion = 'verano' | 'otono' | 'invierno' | 'primavera'

const FECHAS: Record<Estacion, string> = {
  verano: '-01-15', otono: '-04-15', invierno: '-07-15', primavera: '-10-15',
}

export function posicionSol(estacion: Estacion, hora: number, lat: number, lng: number) {
  const f = new Date(`${new Date().getFullYear()}${FECHAS[estacion]}T00:00:00-03:00`)
  f.setUTCHours(f.getUTCHours() + Math.floor(hora), Math.round((hora % 1) * 60))
  const p = SunCalc.getPosition(f, lat, lng)
  return { azimut: p.azimuth, elevacion: p.altitude }
}

// Vector unitario apuntando DESDE la escena HACIA el sol (para light.position)
export function direccionLuz(estacion: Estacion, hora: number, lat: number, lng: number): [number, number, number] {
  const { azimut, elevacion } = posicionSol(estacion, hora, lat, lng)
  // SunCalc: azimut 0 = sur, positivo hacia el oeste. En three: +z hacia el espectador.
  return [
    Math.cos(elevacion) * Math.sin(azimut),
    Math.sin(elevacion),
    Math.cos(elevacion) * Math.cos(azimut),
  ]
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiencia/sol.ts tests/sol.test.ts package.json package-lock.json
git commit -m "M2: posicion solar real con suncalc (TDD)"
```

---

### Task 5: Página RSC `/casas/[slug]` + Portada

**Files:**
- Create: `src/app/(web)/casas/[slug]/page.tsx`, `src/experiencia/Portada.tsx`, `src/experiencia/experiencia.module.css`

**Interfaces:**
- Consumes: colección `casas` (M1), `getPayload` local API.
- Produces: tipo `CasaCompleta` (el doc de Payload con depth 2) exportado desde `page.tsx` y consumido por todos los componentes de momentos; la página compone `<Lienzo><Portada/><Visita/>…</Lienzo>` según qué momentos existan.

- [ ] **Step 1: Página con fetch y 404**

`src/app/(web)/casas/[slug]/page.tsx`:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { Portada } from '@/experiencia/Portada'

export default async function PaginaCasa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'casas',
    where: { slug: { equals: slug }, publicada: { equals: true } },
    depth: 2, limit: 1,
  })
  const casa = docs[0]
  if (!casa) notFound()
  return <Portada casa={casa} />
}

export type CasaCompleta = NonNullable<Awaited<ReturnType<typeof cargarCasa>>>
async function cargarCasa() { /* solo para derivar el tipo */ return null as never }
```

Nota: derivar `CasaCompleta` de los tipos generados de Payload (`import type { Casa } from '@/payload-types'`) — usar ese import real, el bloque anterior del tipo es solo si los generated types no alcanzan con depth.

- [ ] **Step 2: Portada (momento 16:00, del mockup v8)**

`src/experiencia/Portada.tsx`:

```tsx
import type { Casa, Medio } from '@/payload-types'
import s from './experiencia.module.css'

export function Portada({ casa }: { casa: Casa }) {
  const img = casa.momentos?.llegada?.imagen as Medio | undefined
  return (
    <>
      <div className="mom">16:00 · LLEGAS</div>
      <div className="flow">
        <h1>{casa.nombre}</h1>
        {casa.momentos?.llegada?.relato && <p>{casa.momentos.llegada.relato}</p>}
        <div className={s.datos}>
          <span>CASA {casa.numero}</span>
          <span>{casa.specs.superficie} M²</span>
          <span>{casa.specs.dormitorios} DORM</span>
          <span>{casa.specs.banos} BAÑOS</span>
        </div>
      </div>
      {img?.url && (
        <figure className={s.bleed}>
          <img src={img.sizes?.pantalla?.url ?? img.url} alt={img.alt ?? casa.nombre} />
          <figcaption className={s.cap}>LA LLEGADA · {casa.ubicacion?.toUpperCase()}</figcaption>
        </figure>
      )}
    </>
  )
}
```

`src/experiencia/experiencia.module.css` (extraer del mockup v8 las clases `.datos`, `.bleed` con `mask-image`, `.cap` — copiar los valores exactos del bloque `<style>` del mockup).

- [ ] **Step 3: Verificar**

Run: `npm run dev` → `http://localhost:3000/casas/pitrufquen`
Expected: título PITRUFQUÉN, relato, datos en mono, imagen de llegada fundida por abajo (sin borde duro). `/casas/no-existe` → 404.

- [ ] **Step 4: Commit**

```bash
git add src/app src/experiencia
git commit -m "M2: pagina de casa con Portada (16:00)"
```

---

### Task 6: `Lienzo.tsx` — el cielo que anochece + el hilo con la hora

**Files:**
- Create: `src/experiencia/Lienzo.tsx`
- Modify: `src/app/(web)/casas/[slug]/page.tsx` (envolver los momentos)

**Interfaces:**
- Consumes: `colorCielo` (Task 2).
- Produces: `<Lienzo>{children}</Lienzo>` client component que en cada scroll setea `--bg/--fg/--dim` en `document.documentElement` y posiciona el hilo/punto con la hora 16:00→22:30. Expone el progreso vía atributo `data-progreso` en `<body>` (lo usa Decide para la barra).

- [ ] **Step 1: Implementar**

`src/experiencia/Lienzo.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { colorCielo } from './cielo'
import s from './experiencia.module.css'

export function Lienzo({ children }: { children: React.ReactNode }) {
  const walker = useRef<HTMLDivElement>(null)
  const hora = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      const c = colorCielo(p)
      const root = document.documentElement.style
      root.setProperty('--bg', c.bg); root.setProperty('--fg', c.fg); root.setProperty('--dim', c.dim)
      document.body.dataset.progreso = String(Math.round(p * 100))
      if (walker.current) walker.current.style.top = `${8 + p * 84}vh`
      const hh = 16 + p * 6.5
      if (hora.current) hora.current.textContent =
        `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className={s.hilo} aria-hidden />
      <div className={s.walker} ref={walker} aria-hidden><i /><b ref={hora} className="mono">16:00</b></div>
      {children}
    </>
  )
}
```

CSS `.hilo` y `.walker` en `experiencia.module.css`: copiar del mockup v8 (`.thread`, `.walker`) cambiando `position:absolute` por `position:fixed` (aquí el scroll es la ventana, no un contenedor).

- [ ] **Step 2: Verificar**

Run: `npm run dev` → `/casas/pitrufquen`, agregar contenido de relleno temporal si hace falta altura.
Expected: al bajar, el fondo pasa de hueso a noche sin saltos; el punto terracota recorre el borde izquierdo mostrando 16:00→22:30.

- [ ] **Step 3: Commit**

```bash
git add src/experiencia src/app
git commit -m "M2: Lienzo con cielo continuo e hilo del recorrido"
```

---

### Task 7: `Visita.tsx` — scrollytelling con minimapa

**Files:**
- Create: `src/experiencia/Visita.tsx`

**Interfaces:**
- Consumes: `casa.momentos.visita[]` (imagen, titulo, frase, puntoX/puntoY) y `casa.momentos.plano` (para el trazado del minimapa vía `aViewBox` a escala reducida).
- Produces: sección de altura `(n_escenas × 90vh) + 100vh` con stage sticky: imágenes que se funden con Ken Burns, subtítulos escalonados, minimapa "ESTÁS AQUÍ" con el punto en `puntoX/puntoY` (porcentaje del viewBox del plano).

- [ ] **Step 1: Implementar**

`src/experiencia/Visita.tsx` (estructura completa; estilos del mockup v8 `.visita/.stage/.shot/.vcap/.minimap` adaptados a viewport de ventana):

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { Casa, Medio } from '@/payload-types'
import { aViewBox } from './escala'
import s from './experiencia.module.css'

export function Visita({ casa }: { casa: Casa }) {
  const escenas = casa.momentos?.visita ?? []
  const cont = useRef<HTMLElement>(null)
  const [activa, setActiva] = useState(0)
  const plano = casa.momentos?.plano
  const mapa = plano?.muros ? aViewBox(plano.muros as never, [], { escala: 5, margen: 4 }) : null

  useEffect(() => {
    const onScroll = () => {
      const el = cont.current
      if (!el) return
      const span = el.offsetHeight - window.innerHeight
      const p = Math.max(0, Math.min(0.999, (window.scrollY - el.offsetTop) / span))
      setActiva(Math.floor(p * escenas.length))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [escenas.length])

  if (!escenas.length) return null
  return (
    <section ref={cont} className={s.visita} style={{ height: `${escenas.length * 90 + 100}vh` }}>
      <div className={s.stage}>
        {escenas.map((e, i) => {
          const img = e.imagen as Medio
          return <img key={e.id} src={img.sizes?.pantalla?.url ?? img.url!} alt={e.titulo}
                      className={`${s.shot} ${i === activa ? s.on : ''}`} />
        })}
        <div className={s.shade} />
        <div className={s.fadeIn} /><div className={s.fadeOut} />
        {mapa && (
          <figure className={s.minimapa}>
            <svg width="120" viewBox={mapa.viewBox}>
              {mapa.segmentos.map((m, i) => (
                <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#fff" strokeWidth={m.grosor > 2 ? 2 : 0.7} />
              ))}
              <circle fill="var(--acc)" r="4"
                cx={`${escenas[activa]?.puntoX ?? 50}%`} cy={`${escenas[activa]?.puntoY ?? 50}%`} />
            </svg>
            <figcaption className="mono">ESTÁS AQUÍ</figcaption>
          </figure>
        )}
        {escenas.map((e, i) => (
          <div key={e.id} className={`${s.vcap} ${i === activa ? s.on : ''}`}>
            <span className={`mono ${s.k}`}>{e.titulo.toUpperCase()}</span>
            <h3>{e.titulo}</h3>
            <p>{e.frase}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Añadir a `experiencia.module.css` las clases `.visita/.stage/.shot/.on/.shade/.fadeIn/.fadeOut/.vcap/.k/.minimapa` con los valores del mockup (stage `position:sticky; top:0; height:100vh`).

- [ ] **Step 2: Integrar en la página** — en `page.tsx`, después de `<Portada/>`: `<div className="mom">17:00 · LA CAMINAS</div><Visita casa={casa} />`.

- [ ] **Step 3: Verificar**

Run: `/casas/pitrufquen` en viewport móvil (DevTools 390px).
Expected: 3 escenas que se funden al bajar, subtítulos escalonados, punto del minimapa saltando entre terraza→comedor→dormitorio; entrada y salida de la sección fundidas con el cielo (sin borde).

- [ ] **Step 4: Commit**

```bash
git add src/experiencia src/app
git commit -m "M2: Visita guiada scrollytelling con minimapa (17:00)"
```

---

### Task 8: `Planta.tsx` — el plano interactivo

**Files:**
- Create: `src/experiencia/Planta.tsx`

**Interfaces:**
- Consumes: `aViewBox` (Task 3), `casa.momentos.plano` completo.
- Produces: SVG con muros que **se dibujan al entrar** (stroke-dashoffset, IntersectionObserver), recintos `<polygon>` tocables (rol `button`, navegables por teclado), etiquetas nombre+m² en el centroide, y el **reveal**: imagen a sangre del recinto elegido que se expande debajo (height 0→230px) con nombre/m² superpuestos; recinto sin render → solo la frase.

- [ ] **Step 1: Implementar**

`src/experiencia/Planta.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { Casa, Medio } from '@/payload-types'
import { aViewBox } from './escala'
import s from './experiencia.module.css'

export function Planta({ casa }: { casa: Casa }) {
  const plano = casa.momentos?.plano
  const [sel, setSel] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dibujado, setDibujado] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setDibujado(true), { rootMargin: '-20%' })
    if (svgRef.current) obs.observe(svgRef.current)
    return () => obs.disconnect()
  }, [])

  if (!plano?.muros || !plano.recintos?.length) return null
  const recintos = plano.recintos
  const { viewBox, segmentos, poligonos } = aViewBox(plano.muros as never, recintos as never)
  const elegido = sel !== null ? recintos[sel] : null
  const render = elegido?.render as Medio | undefined

  return (
    <>
      <div className={s.planta}>
        <svg ref={svgRef} viewBox={viewBox} className={dibujado ? s.dibujado : ''} role="group"
             aria-label={`Planta de ${casa.nombre}: toca un recinto para verlo terminado`}>
          {segmentos.map((m, i) => (
            <line key={i} className={s.muro} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                  strokeWidth={m.grosor} pathLength={1} />
          ))}
          {poligonos.map((p, i) => (
            <polygon key={i} points={p.puntos} className={`${s.recinto} ${sel === i ? s.sel : ''}`}
                     role="button" tabIndex={0} aria-label={`${p.nombre}, ${p.superficie} metros cuadrados`}
                     onClick={() => setSel(i)}
                     onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(i)} />
          ))}
          {poligonos.map((p, i) => (
            <text key={i} x={p.centro[0]} y={p.centro[1]} className={s.etiqueta} textAnchor="middle">
              {p.nombre}<tspan x={p.centro[0]} dy="8">{p.superficie.toLocaleString('es-CL')}</tspan>
            </text>
          ))}
        </svg>
        <div className={`mono ${s.planCap}`}>
          <span>PLANTA GENERAL</span><span>LÁMINA A1.1 INCLUIDA EN TU COMPRA</span>
        </div>
      </div>
      <div className={`${s.reveal} ${render?.url ? s.abierto : ''}`}>
        {render?.url && <img src={render.sizes?.pantalla?.url ?? render.url} alt={`${elegido?.nombre} terminado`} />}
        {elegido && (
          <div className={s.rmeta}>
            <b className="mono">{elegido.nombre}</b>
            <span className="mono">{elegido.superficie.toLocaleString('es-CL')} M²</span>
          </div>
        )}
      </div>
      <p className={s.rtxt}>{elegido?.frase ?? 'Toca un recinto del plano y aparece aquí, terminado.'}</p>
    </>
  )
}
```

CSS: `.muro { stroke: var(--fg); stroke-dasharray: 1; stroke-dashoffset: 1 }`, `.dibujado .muro { stroke-dashoffset: 0; transition: stroke-dashoffset 2s ease }`, `.recinto`, `.sel`, `.etiqueta` (font mono 6.2px fill var(--dim)), `.reveal/.abierto/.rmeta/.rtxt` — todos con los valores del mockup v8.

- [ ] **Step 2: Integrar** — `<div className="mom">18:30 · LEES EL PLANO</div>` + intro `.flow` + `<Planta casa={casa} />` en `page.tsx`.

- [ ] **Step 3: Verificar**

Expected: al llegar a la sección los muros se trazan solos; tocar COCINA pinta el polígono terracota y expande el render del comedor debajo con "COCINA · 14,27 M²"; tocar LAVANDERÍA (sin render) solo cambia la frase; Tab recorre los recintos y Enter los activa.

- [ ] **Step 4: Commit**

```bash
git add src/experiencia src/app
git commit -m "M2: Planta interactiva dibujada con recintos tocables (18:30)"
```

---

### Task 9: `Maqueta.tsx` + `visor3d.ts` — la maqueta con sol real

**Files:**
- Create: `src/experiencia/Maqueta.tsx`, `src/experiencia/visor3d.ts`

**Interfaces:**
- Consumes: `direccionLuz` (Task 4), `casa.momentos.maqueta.glb` (URL), `casa.coordenadas`.
- Produces: visor lazy — botón "Cargar la maqueta 3D" → `import('./visor3d')` → `crearVisor(canvasHolder, urlGlb) → { fijarSol(dir, elevacionNorm), fijarFondo(css), destruir() }`. Slider hora (7–20, paso 0.25) + estaciones; fondo del canvas sincronizado con `--bg`.

- [ ] **Step 1: Instalar three**

```powershell
npm install three && npm install -D @types/three
```

- [ ] **Step 2: `visor3d.ts`**

```ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export async function crearVisor(holder: HTMLElement, urlGlb: string, onProgreso?: (pct: number) => void) {
  const W = holder.clientWidth, H = holder.clientHeight
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 2000)
  const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x54473a, 0.6)
  const sol = new THREE.DirectionalLight(0xfff4e0, 2)
  sol.castShadow = true
  sol.shadow.mapSize.set(2048, 2048)
  sol.shadow.bias = -0.0004
  scene.add(hemi, sol)

  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  const gltf = await new Promise<import('three/addons/loaders/GLTFLoader.js').GLTF>((res, rej) =>
    loader.load(urlGlb, res, (e) => e.total && onProgreso?.(Math.round((e.loaded / e.total) * 100)), rej))

  const modelo = gltf.scene
  modelo.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
  scene.add(modelo)
  const caja = new THREE.Box3().setFromObject(modelo)
  const dim = caja.getSize(new THREE.Vector3())
  modelo.position.sub(caja.getCenter(new THREE.Vector3()))
  modelo.position.y += dim.y / 2
  const D = Math.max(dim.x, dim.z)

  const suelo = new THREE.Mesh(new THREE.CircleGeometry(D * 1.3, 64), new THREE.ShadowMaterial({ opacity: 0.45 }))
  suelo.rotation.x = -Math.PI / 2
  suelo.receiveShadow = true
  scene.add(suelo)
  sol.shadow.camera.left = -D; sol.shadow.camera.right = D
  sol.shadow.camera.top = D; sol.shadow.camera.bottom = -D
  sol.shadow.camera.far = D * 6
  sol.shadow.camera.updateProjectionMatrix()

  camera.position.set(D * 0.9, dim.y * 1.6, D * 0.85)
  const controles = new OrbitControls(camera, renderer.domElement)
  controles.target.set(0, dim.y * 0.45, 0)
  controles.enableDamping = true
  controles.maxPolarAngle = 1.48
  controles.minDistance = D * 0.35
  controles.maxDistance = D * 2.5

  const calido = new THREE.Color(0xffb877), dia = new THREE.Color(0xfff6e8)
  let vivo = true
  ;(function ciclo() { if (!vivo) return; requestAnimationFrame(ciclo); controles.update(); renderer.render(scene, camera) })()
  holder.prepend(renderer.domElement)

  return {
    fijarSol(dir: [number, number, number], elevNorm: number) {
      const e = Math.max(0.03, elevNorm)
      sol.position.set(dir[0] * D * 2, Math.max(0.05, dir[1]) * D * 2, dir[2] * D * 2)
      sol.color.lerpColors(calido, dia, Math.min(1, e * 1.7))
      sol.intensity = 0.5 + 2.1 * Math.min(1, e * 1.5)
      hemi.intensity = 0.3 + 0.5 * e
    },
    fijarFondo(css: string) { scene.background = new THREE.Color(css) },
    destruir() { vivo = false; renderer.dispose(); holder.querySelector('canvas')?.remove() },
  }
}
```

- [ ] **Step 3: `Maqueta.tsx`** (client): estado `inactivo → cargando(pct) → listo | error`; al tocar el botón hace `const { crearVisor } = await import('./visor3d')`; slider y botones de estación llaman `fijarSol(direccionLuz(estacion, hora, lat, lng), Math.sin(elevacion))`; un `requestAnimationFrame` liviano copia `getComputedStyle(document.documentElement).getPropertyValue('--bg')` a `fijarFondo` una vez por segundo; en error muestra "No pudimos cargar la maqueta aquí — mira la galería y el plano" y NO rompe la página. Reloj mono con la hora del slider. UI y textos del mockov8 (`GIRA CON EL DEDO · PELLIZCA PARA ACERCAR`).

- [ ] **Step 4: Integrar con degradación** — en `page.tsx`: solo si `casa.momentos?.maqueta?.glb` existe → `<div className="mom">19:30 · EL SOL SE PONE</div>` + intro + `<Maqueta casa={casa} />`.

- [ ] **Step 5: Verificar**

Expected: nada de three.js en el bundle inicial (Network: `three` aparece recién al tocar el botón); el GLB de Pitrufquén carga con % de progreso; arrastrar el slider mueve sombras reales; Invierno baja el arco; el fondo del visor acompaña el color de la página.

- [ ] **Step 6: Commit**

```bash
git add src/experiencia package.json package-lock.json
git commit -m "M2: Maqueta 3D lazy con sol real por estacion (19:30)"
```

---

### Task 10: `Prueba.tsx` + `Decide.tsx` + barra fija

**Files:**
- Create: `src/experiencia/Prueba.tsx`, `src/experiencia/Decide.tsx`

**Interfaces:**
- Consumes: `casa.momentos.fotosObra`, `casa.paquete`, precios.
- Produces: momento 21:00 (foto de obra a sangre con overlay "De estas láminas, esta casa") y momento 22:00 (ficha en filas abiertas + precio + botón). El botón de compra emite `window.dispatchEvent(new CustomEvent('basalto:comprar', { detail: { casaId } }))` — **M3 escucha este evento** para abrir la hoja de compra; mientras no exista, el botón muestra tooltip "Muy pronto". Barra fija aparece con `data-progreso > 78`.

- [ ] **Step 1: Implementar `Prueba.tsx`** (RSC): si `fotosObra?.length`, render `.mom` 21:00 + `.flow` intro + `.bleed` con la primera foto, `stamp` "OBRA REAL · {fecha}" y overlay del mockov8.

- [ ] **Step 2: Implementar `Decide.tsx`** (client):

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { Casa } from '@/payload-types'
import s from './experiencia.module.css'

const clp = (n: number) => '$' + n.toLocaleString('es-CL')

export function Decide({ casa }: { casa: Casa }) {
  const [visible, setVisible] = useState(false)
  const precio = casa.precioOferta ?? casa.precio
  useEffect(() => {
    const t = setInterval(() => setVisible(Number(document.body.dataset.progreso ?? 0) > 78), 300)
    return () => clearInterval(t)
  }, [])
  const comprar = () => window.dispatchEvent(new CustomEvent('basalto:comprar', { detail: { casaId: casa.id } }))
  return (
    <>
      <div className="mom" id="decide">22:00 · LA DECIDES</div>
      <div className={s.ficha}>
        <div><b className="mono">SUPERFICIE</b><span>{casa.specs.superficie} m²</span></div>
        <div><b className="mono">DORMITORIOS / BAÑOS</b><span>{casa.specs.dormitorios} / {casa.specs.banos}</span></div>
        <div><b className="mono">LÁMINAS</b><span>{casa.paquete?.laminas ?? '—'} PDF listas para el permiso</span></div>
        {casa.paquete?.incluyeDwg && <div><b className="mono">EDITABLES</b><span>DWG para tu constructor</span></div>}
        {casa.paquete?.incluyeEett && <div><b className="mono">ESPECIFICACIONES</b><span>EETT partida por partida</span></div>}
        <div><b className="mono">ENTREGA</b><span>Inmediata, a tu correo</span></div>
      </div>
      <div className={s.decide}>
        <div className={s.pr}>
          {casa.precioOferta && <s className="mono">{clp(casa.precio)}</s>}
          <em className="mono">{clp(precio)}</em><u>CLP</u>
        </div>
        <button className={s.btn} onClick={comprar}>Comprar los planos</button>
        <p className={s.nota}>Pago con Mercado Pago · Ajustes menores opcionales · La descarga no caduca</p>
      </div>
      <div className={`${s.barra} ${visible ? s.mostrar : ''}`}>
        <div className="mono">{clp(precio)}<small>CASA {casa.numero} · {casa.nombre.toUpperCase()}</small></div>
        <button onClick={comprar}>Comprar los planos</button>
      </div>
    </>
  )
}
```

CSS `.ficha/.decide/.btn` (con glow brasa) `.barra/.mostrar` del mockup v8.

- [ ] **Step 3: Integrar todo en `page.tsx`** — orden final: Lienzo > Portada > mom+Visita > mom+Planta > [mom+Maqueta] > [Prueba] > Decide > pie mínimo ("BASALTO ARQUITECTURA · CASAS PARA EL SUR DE CHILE").

- [ ] **Step 4: Verificar**

Expected: página completa de una pasada en 390px: la barra aparece recién pasada la obra; botón dispara el evento (ver en consola con listener temporal); precios formateados $59.900.

- [ ] **Step 5: Commit**

```bash
git add src/experiencia src/app
git commit -m "M2: Prueba (21:00) y Decide (22:00) con barra de compra"
```

---

### Task 11: Degradación, accesibilidad y rendimiento

**Files:**
- Modify: componentes de Tasks 5–10 según hallazgos

- [ ] **Step 1: Probar degradación** — en el admin, duplicar Pitrufquén como "Casa Prueba" sin GLB, sin fotosObra y con un recinto sin render. Expected: la página omite 19:30 y 21:00 sin huecos raros; el flujo 16:00→18:30→22:00 sigue coherente.

- [ ] **Step 2: Accesibilidad** — verificar con teclado: recintos alcanzables y activables; `prefers-reduced-motion` (emular en DevTools): sin Ken Burns, cielo por pasos; todas las imágenes con `alt` desde `medios.alt`.

- [ ] **Step 3: Rendimiento** — Lighthouse móvil sobre `/casas/pitrufquen` build de producción (`npm run build && npm start`). Expected: Performance ≥ 85, LCP < 2.5s (la imagen de llegada con `fetchpriority="high"`), cero requests de three.js sin tocar el botón.

- [ ] **Step 4: Commit de ajustes**

```bash
git add -A && git commit -m "M2: degradacion, a11y y rendimiento verificados"
git tag m2-experiencia
```

---

## Self-Review (ya aplicado)

- **Cobertura spec §2:** los 6 momentos + hilo + cielo (Tasks 5–10), degradación (11). Los textos/valores visuales referencian el mockup v8 versionado en el repo.
- **Sin placeholders:** lógica pura completa; componentes con código; los CSS que dicen "del mockup v8" apuntan a un archivo concreto commiteado con los valores exactos.
- **Consistencia:** `colorCielo/aViewBox/posicionSol/direccionLuz` definidos en Tasks 2–4 y consumidos con esos nombres en 6–9; el evento `basalto:comprar` queda documentado aquí y es el contrato de entrada de M3.
