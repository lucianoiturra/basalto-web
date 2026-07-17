# Basalto Web M4 — Sitio Completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El sitio terminado y en producción: home, catálogo con filtros, legales, SEO, editor visual de recintos en el CMS, las 7 casas cargadas, e2e de compra y salida a producción con dominio.

**Architecture:** Las páginas públicas reutilizan el lenguaje "Un día en la casa" (mismo CSS global y componentes de M2); el catálogo filtra por query params contra el local API de Payload; el editor de polígonos es un custom field de Payload que reemplaza el ingreso de JSON a mano.

**Tech Stack:** Next.js (metadata API, sitemap), Payload custom field components, Playwright, Vercel Analytics.

**Prerequisitos:** M1–M3 completos (tags `m1-base`, `m2-experiencia`, `m3-compra`).

## Global Constraints

- Home y catálogo respetan el sistema: hueso→noche solo en la página de casa; home/catálogo viven en la franja "tarde" (`--bg #EFE9DD` fijo) con el mismo tipo de componentes — sin inventar un segundo lenguaje.
- Sin jerga en todo el copy; los textos de "cómo funciona" explican PDF/DWG/EETT en una frase cada uno.
- Contenidos que faltan del usuario (número WhatsApp, quiénes somos, testimonios, precios reales por casa) se piden ANTES de la Task 6; si no llegan, se lanza sin testimonios y con los precios que el usuario confirme por casa (no inventar).

## File Structure

```
src/app/(web)/page.tsx                (home)
src/app/(web)/casas/page.tsx          (catálogo + filtros por searchParams)
src/componentes/TarjetaCasa.tsx
src/componentes/ComoFunciona.tsx
src/app/(web)/terminos/page.tsx
src/app/(web)/privacidad/page.tsx
src/app/sitemap.ts, src/app/robots.ts
src/campos/EditorRecintos.tsx         (custom field Payload)
tests/e2e/compra.spec.ts              (Playwright)
```

---

### Task 1: Home

**Files:**
- Create: `src/app/(web)/page.tsx` (reemplaza el provisional de M2), `src/componentes/TarjetaCasa.tsx`, `src/componentes/ComoFunciona.tsx`

**Interfaces:**
- Consumes: colección `casas` (`publicada=true`), CSS global de M2.
- Produces: `TarjetaCasa({ casa })` reutilizada por el catálogo (Task 2).

- [ ] **Step 1: `TarjetaCasa.tsx`**

```tsx
import Link from 'next/link'
import type { Casa, Medio } from '@/payload-types'
import s from './componentes.module.css'

const clp = (n: number) => '$' + n.toLocaleString('es-CL')

export function TarjetaCasa({ casa }: { casa: Casa }) {
  const img = casa.momentos?.llegada?.imagen as Medio | undefined
  const precio = casa.precioOferta ?? casa.precio
  return (
    <Link href={`/casas/${casa.slug}`} className={s.tarjeta}>
      {img?.url && <img src={img.sizes?.tarjeta?.url ?? img.url} alt={img.alt ?? casa.nombre} loading="lazy" />}
      <div className={s.tarjetaPie}>
        <span className={`mono ${s.tNum}`}>CASA {casa.numero}</span>
        <h3>{casa.nombre}</h3>
        <div className={`mono ${s.tDatos}`}>
          <span>{casa.specs.superficie} M²</span><span>{casa.specs.pisos} PISO{casa.specs.pisos > 1 ? 'S' : ''}</span>
          <span>{casa.specs.dormitorios} DORM</span><span>{clp(precio)}</span>
        </div>
      </div>
    </Link>
  )
}
```

CSS: imagen a sangre con `mask-image` inferior (mismo recurso del lenguaje), pie con hairline, hover sutil (imagen escala 1.02).

- [ ] **Step 2: Home (`page.tsx`)** — estructura: portada (render de llegada de una casa destacada a pantalla ~80vh, wordmark BASALTO, titular "Camina tu casa antes de construirla", CTA "Ver las casas"); `<ComoFunciona/>` (3 pasos: "Elige y recórrela" / "Paga con Mercado Pago" / "Descarga y construye" — cada uno 2 líneas sin jerga); grid de `TarjetaCasa` (todas las publicadas, orden por `numero`); bloque quiénes somos breve; FAQ (4 preguntas: qué recibo, sirve para el permiso, qué es un DWG, qué son los ajustes menores — respuestas de 2 líneas); pie con WhatsApp + legales.

- [ ] **Step 3: Verificar** — `/` en 390px: LCP con la imagen destacada, tarjetas cargan lazy, CTA lleva a `/casas`.

- [ ] **Step 4: Commit**

```bash
git add src/app src/componentes
git commit -m "M4: home con tarjetas y como funciona"
```

---

### Task 2: Catálogo con filtros

**Files:**
- Create: `src/app/(web)/casas/page.tsx`

**Interfaces:**
- Consumes: `TarjetaCasa`.
- Produces: `/casas?dormitorios=4&pisos=1&superficie=grande` — filtros server-side vía searchParams; `superficie`: `compacta` (<120), `media` (120–160), `grande` (>160).

- [ ] **Step 1: Implementar**

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { TarjetaCasa } from '@/componentes/TarjetaCasa'

const RANGOS = {
  compacta: { less_than: 120 },
  media: { greater_than_equal: 120, less_than_equal: 160 },
  grande: { greater_than: 160 },
} as const

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const where: Record<string, unknown> = { publicada: { equals: true } }
  if (sp.dormitorios) where['specs.dormitorios'] = { greater_than_equal: Number(sp.dormitorios) }
  if (sp.pisos) where['specs.pisos'] = { equals: Number(sp.pisos) }
  if (sp.superficie && sp.superficie in RANGOS) where['specs.superficie'] = RANGOS[sp.superficie as keyof typeof RANGOS]

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'casas', where: where as never, sort: 'numero', depth: 2, limit: 50 })

  return (
    <main>
      <div className="mom">EL CATÁLOGO</div>
      <div className="flow"><h1>Elige qué casa visitar</h1></div>
      <nav aria-label="Filtros">{/* chips-enlace: TODAS · 1 PISO · 2 PISOS · 3+ DORM · 4+ DORM · COMPACTA · MEDIA · GRANDE — cada uno un <Link> que arma el query param; el activo subrayado terracota */}
        {[['', 'TODAS'], ['?pisos=1', '1 PISO'], ['?pisos=2', '2 PISOS'], ['?dormitorios=3', '3+ DORM'], ['?dormitorios=4', '4+ DORM'], ['?superficie=compacta', 'COMPACTA'], ['?superficie=media', 'MEDIA'], ['?superficie=grande', 'GRANDE']].map(([q, t]) => (
          <Link key={t} href={`/casas${q}`} className="mono">{t}</Link>
        ))}
      </nav>
      {docs.length === 0 && <p className="flow">Ninguna casa calza con ese filtro todavía. Mira todas — o escríbenos: quizás la próxima sea la tuya.</p>}
      <section>{docs.map((c) => <TarjetaCasa key={c.id} casa={c} />)}</section>
    </main>
  )
}
```

- [ ] **Step 2: Verificar** — `/casas?pisos=2` muestra solo Loncoche; `/casas?superficie=grande` muestra Pitrufquén, María Pinto, Lumaco; filtro sin resultados muestra el mensaje amable.

- [ ] **Step 3: Commit**

```bash
git add src/app
git commit -m "M4: catalogo con filtros por pisos, dormitorios y superficie"
```

---

### Task 3: Legales

**Files:**
- Create: `src/app/(web)/terminos/page.tsx`, `src/app/(web)/privacidad/page.tsx`

- [ ] **Step 1: Escribir ambas páginas** con este contenido base (ajustable por el usuario):

Términos — secciones: (1) Qué compras: licencia de uso de los planos para construir **un** proyecto propio; no se pueden revender ni redistribuir los archivos. (2) Entrega digital inmediata: el enlace llega al correo y no caduca. (3) Derecho a retracto: al ser contenido digital de entrega inmediata, la descarga del paquete agota la entrega; ante problemas con los archivos respondemos y reponemos (Ley 19.496 del Consumidor). (4) Ajustes menores: alcance a convenir por escrito tras la compra; no incluyen cambios estructurales mayores. (5) Responsabilidad: la construcción debe dirigirla un profesional habilitado; los permisos municipales son responsabilidad del propietario (los planos van listos para ese trámite). (6) Contacto.

Privacidad — qué guardamos (correo y datos de la orden), para qué (entregar la compra y soporte), quién procesa el pago (Mercado Pago; no vemos tu tarjeta), correos (solo transaccionales), derechos (pedir eliminación escribiendo al contacto).

- [ ] **Step 2: Enlazar desde el pie** (home y página de casa) y desde la hoja de compra ("Al pagar aceptas los términos").

- [ ] **Step 3: Commit**

```bash
git add src/app
git commit -m "M4: terminos y privacidad"
```

---

### Task 4: SEO — metadata, OG, sitemap, robots

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/(web)/casas/[slug]/page.tsx`, `src/app/(web)/layout.tsx`

- [ ] **Step 1: `generateMetadata` por casa**

En `casas/[slug]/page.tsx`:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'casas', where: { slug: { equals: slug } }, depth: 2, limit: 1 })
  const casa = docs[0]
  if (!casa) return {}
  const img = casa.momentos?.llegada?.imagen
  return {
    title: `Casa ${casa.nombre} · ${casa.specs.superficie} m² · Planos listos para construir | Basalto`,
    description: `${casa.specs.dormitorios} dormitorios, ${casa.specs.banos} baños, ${casa.specs.pisos} piso(s). Recórrela en 3D, mira cómo se asolea y descarga los planos completos hoy.`,
    openGraph: { images: typeof img === 'object' && img?.url ? [img.url] : [] },
  }
}
```

- [ ] **Step 2: `sitemap.ts` y `robots.ts`**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'casas', where: { publicada: { equals: true } }, limit: 100 })
  const base = process.env.NEXT_PUBLIC_URL!
  return [
    { url: base }, { url: `${base}/casas` },
    ...docs.map((c) => ({ url: `${base}/casas/${c.slug}`, lastModified: new Date(c.updatedAt) })),
  ]
}
```

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: ['/admin', '/api', '/descarga', '/gracias'] }],
    sitemap: `${process.env.NEXT_PUBLIC_URL}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Verificar** — `curl localhost:3000/sitemap.xml` lista las casas publicadas; compartir la URL de Pitrufquén en un validador OG muestra el render de llegada.

- [ ] **Step 4: Commit**

```bash
git add src/app
git commit -m "M4: metadata por casa, sitemap y robots"
```

---

### Task 5: Editor visual de recintos (custom field de Payload)

**Files:**
- Create: `src/campos/EditorRecintos.tsx`
- Modify: `src/collections/Casas.ts` (agregar el campo UI dentro del grupo `plano`)

**Interfaces:**
- Consumes: campo hermano `poligono` (json) de cada recinto y la imagen de la lámina como fondo de referencia.
- Produces: en el admin, dibujar el polígono clickeando vértices sobre la planta en vez de escribir JSON. Escribe al MISMO campo `poligono` — la web pública no cambia.

- [ ] **Step 1: Agregar imagen de referencia al grupo plano**

En `Casas.ts`, dentro de `plano.fields`, antes de `muros`:

```ts
{ name: 'imagenReferencia', label: 'Imagen de la planta (solo para dibujar encima)', type: 'upload', relationTo: 'medios' },
{ name: 'anchoMetros', label: 'Ancho real de la planta (m)', type: 'number', defaultValue: 21 },
```

- [ ] **Step 2: `EditorRecintos.tsx`** — componente client de campo UI dentro de cada item del array `recintos`:

```tsx
'use client'
import { useField, useFormFields } from '@payloadcms/ui'
import { useRef, useState } from 'react'

export function EditorRecintos({ path }: { path: string }) {
  // path llega como momentos.plano.recintos.N.editor → el campo hermano es …N.poligono
  const rutaPoligono = path.replace(/editor$/, 'poligono')
  const { setValue, value } = useField<[number, number][]>({ path: rutaPoligono })
  const imagenId = useFormFields(([fields]) => fields['momentos.plano.imagenReferencia']?.value)
  const anchoM = useFormFields(([fields]) => Number(fields['momentos.plano.anchoMetros']?.value ?? 21))
  const img = useRef<HTMLImageElement>(null)
  const [puntos, setPuntos] = useState<[number, number][]>(Array.isArray(value) ? value : [])

  if (!imagenId) return <p>Sube primero la imagen de la planta en "Imagen de la planta".</p>

  const click = (e: React.MouseEvent) => {
    const r = img.current!.getBoundingClientRect()
    const escala = anchoM / r.width // px → metros
    const p: [number, number] = [
      Math.round((e.clientX - r.left) * escala * 100) / 100,
      Math.round((e.clientY - r.top) * escala * 100) / 100,
    ]
    const nuevos = [...puntos, p]
    setPuntos(nuevos)
    if (nuevos.length >= 3) setValue(nuevos)
  }

  return (
    <div>
      <p style={{ fontSize: 12 }}>Haz clic en las esquinas del recinto (mínimo 3). Doble clic borra todo.</p>
      <div style={{ position: 'relative', cursor: 'crosshair' }} onClick={click}
           onDoubleClick={() => { setPuntos([]); setValue([] as never) }}>
        <img ref={img} src={`/api/medios/file/${imagenId}`} alt="Planta" style={{ width: '100%', display: 'block' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {puntos.length >= 2 && (
            <polygon
              points={puntos.map((p) => {
                const r = img.current?.getBoundingClientRect()
                const f = r ? r.width / anchoM : 1
                return `${p[0] * f},${p[1] * f}`
              }).join(' ')}
              fill="rgba(194,85,46,.3)" stroke="#C2552E"
            />
          )}
        </svg>
      </div>
    </div>
  )
}
```

Registrar en el array `recintos` de `Casas.ts`:

```ts
{ name: 'editor', type: 'ui', admin: { components: { Field: '/src/campos/EditorRecintos#EditorRecintos' } } },
```

Nota: la resolución del `src` de la imagen y las rutas de `useFormFields` dentro de arrays pueden variar según la versión de Payload — validar contra la documentación de custom fields de la versión instalada y ajustar la obtención de la URL (puede requerir un fetch del doc de medios).

- [ ] **Step 3: Verificar** — en el admin, subir la lámina A1.1 como referencia, dibujar el polígono de la COCINA con 4 clics. Expected: el campo `poligono` del recinto queda con las coordenadas en metros (~[[0,0],[4.35,0],[4.35,3.02],[0,3.02]]); la página pública pinta ese recinto igual que antes.

- [ ] **Step 4: Commit**

```bash
git add src/campos src/collections/Casas.ts
git commit -m "M4: editor visual de recintos sobre la planta en el admin"
```

---

### Task 6: Cargar las 7 casas

**Files:** (contenido, no código)

- [ ] **Step 1: Pedir al usuario lo pendiente** — precios por casa, número de WhatsApp, texto quiénes somos, testimonios (opcional), y los `.dae` de 003/007 si ya los exportó.

- [ ] **Step 2: Pipeline por casa (002, 003, 004, 005, 006, 007)** — por cada una: `preparar-zip` + `preparar-webp` (renders de `04 - Vistas`) + `exportar-glb` (si hay `.dae`); crear la casa en el admin con: relato de llegada, 3+ escenas de visita, plano con recintos (usar el editor de Task 5 con su lámina A1.1), materiales, fotos de obra si existen, paquete y precio. Marcar `publicada` solo cuando pase el checklist: escenas ≥ 3, recintos = los del cuadro de superficies, ZIP descarga bien.

- [ ] **Step 3: Verificar** — `/casas` muestra las 7; cada página carga sin momentos vacíos; 003 y 007 sin momento de maqueta (correcto mientras no haya GLB).

- [ ] **Step 4: Commit** (ajustes de config que hayan surgido)

```bash
git add -A && git commit -m "M4: siete casas cargadas y publicadas" --allow-empty
```

---

### Task 7: E2E de compra con Playwright

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/compra.spec.ts`

- [ ] **Step 1: Instalar y configurar**

```powershell
npm install -D @playwright/test
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: process.env.E2E_URL ?? 'http://localhost:3000' },
  projects: [{ name: 'movil', use: { ...devices['Pixel 7'] } }],
})
```

- [ ] **Step 2: Test del flujo hasta Mercado Pago**

`tests/e2e/compra.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('la experiencia carga y el flujo de compra llega a Mercado Pago', async ({ page }) => {
  await page.goto('/casas/pitrufquen')
  await expect(page.getByRole('heading', { name: /pitrufquén/i })).toBeVisible()
  // recorre hasta el final para que aparezca la compra
  await page.keyboard.press('End')
  await page.getByRole('button', { name: /comprar los planos/i }).first().click()
  await page.getByPlaceholder(/tu correo/i).fill('e2e@test.cl')
  await page.getByRole('button', { name: /pagar .* con mercado pago/i }).click()
  await page.waitForURL(/mercadopago/, { timeout: 20000 })
})

test('descarga con token inválido muestra 404 amable', async ({ page }) => {
  await page.goto('/descarga/token-invalido')
  await expect(page.getByText(/no corresponde a una compra/i)).toBeVisible()
})
```

- [ ] **Step 3: Verificar** — `npx playwright test` con el dev server corriendo y `MP_ACCESS_TOKEN` de prueba. Expected: 2 tests PASS. (El pago dentro de MP queda como verificación manual de M3 Task 8 — no automatizar la tarjeta.)

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e package.json package-lock.json
git commit -m "M4: e2e de compra hasta Mercado Pago y 404 de descarga"
```

---

### Task 8: Producción — dominio, analítica y QA final

**Files:**
- Modify: `src/app/(web)/layout.tsx` (Analytics)

- [ ] **Step 1: Vercel Analytics**

```powershell
npm install @vercel/analytics
```

En `layout.tsx`: `import { Analytics } from '@vercel/analytics/react'` y `<Analytics />` antes de cerrar `<body>`.

- [ ] **Step 2: Dominio** — conectar el dominio del usuario en Vercel (o mantener `.vercel.app` si aún no hay); actualizar `NEXT_PUBLIC_URL`, la `notification_url` en MP y el remitente verificado en Resend.

- [ ] **Step 3: QA final (checklist en el celular real)** — [ ] las 7 casas cargan < 3 s; [ ] visita fluida sin saltos; [ ] plano tocable con el dedo; [ ] maqueta carga y el sol responde; [ ] compra sandbox completa; [ ] correo llega a Gmail sin spam; [ ] descarga abre el ZIP; [ ] WhatsApp abre chat con mensaje precargado; [ ] Lighthouse móvil ≥ 85 en home, catálogo y una casa.

- [ ] **Step 4: Cambiar MP a producción** (cuando el usuario tenga las credenciales) y hacer una compra real de $1.000 de prueba con reembolso manual.

- [ ] **Step 5: Commit y tag final**

```bash
git add -A && git commit -m "M4 completo: Basalto Web en produccion"
git tag m4-sitio
```

---

## Self-Review (ya aplicado)

- **Cobertura spec §4 (home/catálogo/legales), §6 (editor visual — deuda de M1 saldada aquí), §9–§10 (QA, analítica, e2e), §11 (fase 4).** Contenidos pendientes del usuario explícitos en Task 6 Step 1 — sin inventar precios ni testimonios.
- **Sin placeholders:** código completo en tarjeta, catálogo, sitemap, robots, metadata, editor (con nota honesta de validación contra la versión de Payload) y e2e.
- **Consistencia:** `TarjetaCasa` usa `momentos.llegada.imagen` y `specs.*` tal como M1 los define; el editor escribe al campo `poligono` que M2 `Planta.tsx` ya consume; `NEXT_PUBLIC_URL` es la misma env que definió M3.
