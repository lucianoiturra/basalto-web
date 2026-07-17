# Basalto Web M3 — Compra y Entrega Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flujo completo de compra: hoja de compra con add-on de ajustes, pago con Mercado Pago Checkout Pro, confirmación por webhook, entrega inmediata por correo y página de descarga permanente con enlaces firmados de R2.

**Architecture:** Route handlers de Next.js para crear la preferencia y recibir el webhook (idempotente, firma verificada); las órdenes viven en la colección `ordenes` de M1; los ZIPs privados se sirven con URLs firmadas de 15 minutos generadas on-demand; correos transaccionales con Resend.

**Tech Stack:** SDK `mercadopago` v2, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, `resend`, Vitest.

**Prerequisitos:** M1 (`ordenes`, `paquetes`, R2) y M2 (evento `basalto:comprar` desde `Decide.tsx`). Cuenta Mercado Pago con credenciales de **prueba** (sandbox) y luego producción; cuenta Resend con dominio verificado.

## Global Constraints

- Moneda: CLP, sin decimales.
- El webhook es la ÚNICA fuente de verdad del pago (nunca marcar `pagada` desde el redirect).
- Idempotencia: procesar el mismo `payment_id` dos veces no cambia nada ni reenvía correos.
- `tokenDescarga` no caduca; los enlaces firmados duran 15 min y se generan al momento.
- Nuevas env vars: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_URL` (agregarlas a `.env.example` y a Vercel en la task donde aparecen).
- Textos al comprador: cálidos, segunda persona, cero jerga ("Es tuya. Revisa tu correo.").

## File Structure

```
src/lib/precios.ts               (PURO: calcularMonto — TDD)
src/lib/firmaMp.ts               (PURO: validarFirmaMp — TDD)
src/lib/r2Firmas.ts              (enlaceFirmado(key) → URL 15 min)
src/lib/correos.ts               (enviarEntrega, notificarAjustes)
src/app/api/comprar/route.ts     (POST → orden pendiente + preference → init_point)
src/app/api/webhooks/mp/route.ts (POST → verifica, confirma, entrega)
src/app/api/ordenes/estado/route.ts (GET ?id= → {estado, token?})
src/app/api/descarga/[token]/enlace/route.ts (GET → {url firmada})
src/experiencia/HojaCompra.tsx   (client: bottom sheet de compra)
src/app/(web)/gracias/page.tsx   (retorno de MP con polling)
src/app/(web)/descarga/[token]/page.tsx (descargas permanentes)
tests/precios.test.ts, tests/firmaMp.test.ts
```

---

### Task 1: `calcularMonto` (TDD)

**Files:**
- Create: `src/lib/precios.ts`
- Test: `tests/precios.test.ts`

**Interfaces:**
- Produces: `calcularMonto(casa: { precio: number; precioOferta?: number | null; precioAjustes?: number | null }, conAjustes: boolean): number` — usado por `api/comprar` y por la UI de la hoja.

- [ ] **Step 1: Test que falla**

`tests/precios.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calcularMonto } from '../src/lib/precios'

describe('calcularMonto', () => {
  it('usa el precio de oferta cuando existe', () => {
    expect(calcularMonto({ precio: 89900, precioOferta: 59900 }, false)).toBe(59900)
  })
  it('usa el precio normal sin oferta', () => {
    expect(calcularMonto({ precio: 89900, precioOferta: null }, false)).toBe(89900)
  })
  it('suma los ajustes cuando van incluidos', () => {
    expect(calcularMonto({ precio: 89900, precioOferta: 59900, precioAjustes: 150000 }, true)).toBe(209900)
  })
  it('ajustes sin precio definido suman 0', () => {
    expect(calcularMonto({ precio: 89900 }, true)).toBe(89900)
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/lib/precios.ts`:

```ts
export function calcularMonto(
  casa: { precio: number; precioOferta?: number | null; precioAjustes?: number | null },
  conAjustes: boolean,
): number {
  const base = casa.precioOferta ?? casa.precio
  return base + (conAjustes ? casa.precioAjustes ?? 0 : 0)
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/precios.ts tests/precios.test.ts
git commit -m "M3: calcularMonto con oferta y add-on (TDD)"
```

---

### Task 2: `validarFirmaMp` (TDD)

**Files:**
- Create: `src/lib/firmaMp.ts`
- Test: `tests/firmaMp.test.ts`

**Interfaces:**
- Produces: `validarFirmaMp(xSignature: string, xRequestId: string, dataId: string, secreto: string): boolean` según el esquema de Mercado Pago (`x-signature: ts=…,v1=…`; manifest `id:{dataId};request-id:{xRequestId};ts:{ts};` firmado HMAC-SHA256).

- [ ] **Step 1: Test que falla**

`tests/firmaMp.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { validarFirmaMp } from '../src/lib/firmaMp'

const SECRETO = 'secreto-de-prueba'
function firmar(dataId: string, requestId: string, ts: string) {
  const v1 = createHmac('sha256', SECRETO)
    .update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex')
  return `ts=${ts},v1=${v1}`
}

describe('validarFirmaMp', () => {
  it('acepta una firma válida', () => {
    expect(validarFirmaMp(firmar('123', 'req-1', '1700000000'), 'req-1', '123', SECRETO)).toBe(true)
  })
  it('rechaza firma alterada', () => {
    expect(validarFirmaMp(firmar('123', 'req-1', '1700000000'), 'req-1', '999', SECRETO)).toBe(false)
  })
  it('rechaza encabezado malformado', () => {
    expect(validarFirmaMp('basura', 'req-1', '123', SECRETO)).toBe(false)
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/lib/firmaMp.ts`:

```ts
import { createHmac, timingSafeEqual } from 'crypto'

export function validarFirmaMp(xSignature: string, xRequestId: string, dataId: string, secreto: string): boolean {
  const partes: Record<string, string> = {}
  for (const seg of xSignature.split(',')) {
    const [k, v] = seg.trim().split('=')
    if (k && v) partes[k] = v
  }
  if (!partes.ts || !partes.v1) return false
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${partes.ts};`
  const esperado = createHmac('sha256', secreto).update(manifest).digest('hex')
  const a = Buffer.from(esperado), b = Buffer.from(partes.v1)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/firmaMp.ts tests/firmaMp.test.ts
git commit -m "M3: validacion de firma del webhook de Mercado Pago (TDD)"
```

---

### Task 3: Endpoint `POST /api/comprar`

**Files:**
- Create: `src/app/api/comprar/route.ts`
- Modify: `.env.example` (`MP_ACCESS_TOKEN`, `NEXT_PUBLIC_URL`)

**Interfaces:**
- Consumes: `calcularMonto`, colecciones `casas`/`ordenes`.
- Produces: `POST {casaId, email, conAjustes, descripcionAjustes?}` → `201 {initPoint, ordenId}`. Crea la orden `pendiente` y la preference con `external_reference = orden.id`, `notification_url = ${NEXT_PUBLIC_URL}/api/webhooks/mp`, `back_urls.success/failure/pending = ${NEXT_PUBLIC_URL}/gracias?orden={id}`.

- [ ] **Step 1: Instalar SDK e implementar**

```powershell
npm install mercadopago
```

`src/app/api/comprar/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { calcularMonto } from '@/lib/precios'

export async function POST(req: NextRequest) {
  const { casaId, email, conAjustes, descripcionAjustes } = await req.json()
  if (!casaId || !email) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const payload = await getPayload({ config })
  const casa = await payload.findByID({ collection: 'casas', id: casaId }).catch(() => null)
  if (!casa || !casa.publicada) return NextResponse.json({ error: 'Casa no disponible' }, { status: 404 })

  const monto = calcularMonto(casa, Boolean(conAjustes))
  const orden = await payload.create({
    collection: 'ordenes',
    data: { email, casa: casa.id, monto, conAjustes: Boolean(conAjustes), descripcionAjustes, estado: 'pendiente' },
  })

  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
  const url = process.env.NEXT_PUBLIC_URL!
  const pref = await new Preference(mp).create({
    body: {
      items: [{
        id: String(casa.id),
        title: `Planos Casa ${casa.nombre}${conAjustes ? ' + ajustes menores' : ''}`,
        quantity: 1, currency_id: 'CLP', unit_price: monto,
      }],
      external_reference: String(orden.id),
      notification_url: `${url}/api/webhooks/mp`,
      back_urls: {
        success: `${url}/gracias?orden=${orden.id}`,
        failure: `${url}/gracias?orden=${orden.id}`,
        pending: `${url}/gracias?orden=${orden.id}`,
      },
      auto_return: 'approved',
    },
  })

  await payload.update({ collection: 'ordenes', id: orden.id, data: { mpPreferenceId: pref.id } })
  return NextResponse.json({ initPoint: pref.init_point, ordenId: orden.id }, { status: 201 })
}
```

- [ ] **Step 2: Verificar con credenciales de prueba**

Run (con `MP_ACCESS_TOKEN` de prueba en `.env`):
```powershell
curl -X POST http://localhost:3000/api/comprar -H "Content-Type: application/json" -d '{"casaId": ID_PITRUFQUEN, "email": "test@test.cl", "conAjustes": false}'
```
Expected: `201` con `initPoint` (URL sandbox de MP); en el admin aparece la orden `pendiente` con `mpPreferenceId`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/comprar .env.example package.json package-lock.json
git commit -m "M3: endpoint de compra que crea orden y preferencia MP"
```

---

### Task 4: Correos con Resend

**Files:**
- Create: `src/lib/correos.ts`
- Modify: `.env.example` (`RESEND_API_KEY`, `ADMIN_EMAIL`)

**Interfaces:**
- Produces: `enviarEntrega(email, nombreCasa, token)` (asunto "Tus planos de la Casa X están listos", enlace `${NEXT_PUBLIC_URL}/descarga/${token}`) y `notificarAjustes(ordenId, email, nombreCasa, descripcion)` al `ADMIN_EMAIL`. Ambas devuelven `Promise<void>` y NO lanzan (log en error, el webhook nunca falla por correo).

- [ ] **Step 1: Implementar**

```powershell
npm install resend
```

`src/lib/correos.ts`:

```ts
import { Resend } from 'resend'

const resend = () => new Resend(process.env.RESEND_API_KEY)
const REMITENTE = 'Basalto Arquitectura <hola@basalto.cl>' // dominio verificado en Resend

export async function enviarEntrega(email: string, nombreCasa: string, token: string): Promise<void> {
  const enlace = `${process.env.NEXT_PUBLIC_URL}/descarga/${token}`
  try {
    await resend().emails.send({
      from: REMITENTE, to: email,
      subject: `Tus planos de la Casa ${nombreCasa} están listos`,
      html: `<p>¡Es tuya!</p>
<p>Aquí están los planos completos de la <b>Casa ${nombreCasa}</b>: láminas PDF, archivos DWG editables y especificaciones técnicas.</p>
<p><a href="${enlace}">Descargar mi paquete</a></p>
<p>Guarda este correo: el enlace es tuyo para siempre.</p>
<p>¿Dudas? Responde este correo y te ayudamos.</p>`,
    })
  } catch (e) { console.error('[correos] entrega falló', e) }
}

export async function notificarAjustes(ordenId: string | number, email: string, nombreCasa: string, descripcion: string): Promise<void> {
  try {
    await resend().emails.send({
      from: REMITENTE, to: process.env.ADMIN_EMAIL!,
      subject: `Orden ${ordenId}: ajustes menores para Casa ${nombreCasa}`,
      html: `<p>Comprador: ${email}</p><p>Pide ajustar:</p><blockquote>${descripcion || '(sin descripción)'}</blockquote>`,
    })
  } catch (e) { console.error('[correos] notificación falló', e) }
}
```

- [ ] **Step 2: Verificar** — script rápido `node -e` o ruta temporal que llame `enviarEntrega` con tu correo. Expected: correo recibido con enlace.

- [ ] **Step 3: Commit**

```bash
git add src/lib/correos.ts .env.example package.json package-lock.json
git commit -m "M3: correos de entrega y notificacion de ajustes (Resend)"
```

---

### Task 5: Webhook `POST /api/webhooks/mp` (idempotente)

**Files:**
- Create: `src/app/api/webhooks/mp/route.ts`
- Modify: `.env.example` (`MP_WEBHOOK_SECRET`)

**Interfaces:**
- Consumes: `validarFirmaMp`, `enviarEntrega`, `notificarAjustes`, colección `ordenes`.
- Produces: confirma pagos: firma inválida → 401; tipo ≠ payment → 200 no-op; pago `approved` → orden `pagada` + correos (solo la primera vez); pago rechazado → orden `fallida`. Siempre 200 tras procesar (MP reintenta ante ≠2xx).

- [ ] **Step 1: Implementar**

`src/app/api/webhooks/mp/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getPayload } from 'payload'
import config from '@payload-config'
import { validarFirmaMp } from '@/lib/firmaMp'
import { enviarEntrega, notificarAjustes } from '@/lib/correos'

export async function POST(req: NextRequest) {
  const dataId = req.nextUrl.searchParams.get('data.id') ?? ''
  const tipo = req.nextUrl.searchParams.get('type')
  const firma = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''

  if (!validarFirmaMp(firma, requestId, dataId, process.env.MP_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }
  if (tipo !== 'payment') return NextResponse.json({ ok: true })

  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
  const pago = await new Payment(mp).get({ id: dataId })
  const ordenId = pago.external_reference
  if (!ordenId) return NextResponse.json({ ok: true })

  const payload = await getPayload({ config })
  const orden = await payload.findByID({ collection: 'ordenes', id: ordenId, depth: 1 }).catch(() => null)
  if (!orden) { console.error(`[webhook] pago ${dataId} sin orden ${ordenId}`); return NextResponse.json({ ok: true }) }

  if (orden.estado === 'pagada') return NextResponse.json({ ok: true }) // idempotencia

  if (pago.status === 'approved') {
    await payload.update({ collection: 'ordenes', id: orden.id, data: { estado: 'pagada', mpPaymentId: String(pago.id) } })
    const casa = typeof orden.casa === 'object' ? orden.casa : null
    await enviarEntrega(orden.email, casa?.nombre ?? '', orden.tokenDescarga!)
    if (orden.conAjustes) await notificarAjustes(orden.id, orden.email, casa?.nombre ?? '', orden.descripcionAjustes ?? '')
  } else if (pago.status === 'rejected' || pago.status === 'cancelled') {
    await payload.update({ collection: 'ordenes', id: orden.id, data: { estado: 'fallida', mpPaymentId: String(pago.id) } })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verificar firma y flujo**

1. `curl -X POST "http://localhost:3000/api/webhooks/mp?data.id=1&type=payment"` sin headers → `401`.
2. Con la simulación de webhooks del panel de MP (o `ngrok`/`vercel dev` + pago sandbox completo en Task 8) → orden pasa a `pagada` y llega el correo; repetir la notificación → sigue `pagada`, sin segundo correo.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks .env.example
git commit -m "M3: webhook MP idempotente con firma verificada"
```

---

### Task 6: Estado de orden + enlaces firmados de R2

**Files:**
- Create: `src/app/api/ordenes/estado/route.ts`, `src/lib/r2Firmas.ts`, `src/app/api/descarga/[token]/enlace/route.ts`

**Interfaces:**
- Produces:
  - `GET /api/ordenes/estado?id=X` → `{estado, token?}` (`token` solo si `pagada`).
  - `enlaceFirmado(key: string): Promise<string>` — URL firmada 15 min del bucket privado.
  - `GET /api/descarga/[token]/enlace` → `{url}` del ZIP de la casa de esa orden pagada; token desconocido → 404.

- [ ] **Step 1: Implementar los tres archivos**

```powershell
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

`src/lib/r2Firmas.ts`:

```ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
})

export function enlaceFirmado(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET_PRIVATE!, Key: key }), { expiresIn: 900 })
}
```

`src/app/api/ordenes/estado/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const payload = await getPayload({ config })
  const orden = await payload.findByID({ collection: 'ordenes', id, depth: 0 }).catch(() => null)
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 })
  return NextResponse.json({
    estado: orden.estado,
    ...(orden.estado === 'pagada' ? { token: orden.tokenDescarga } : {}),
  })
}
```

`src/app/api/descarga/[token]/enlace/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { enlaceFirmado } from '@/lib/r2Firmas'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'ordenes',
    where: { tokenDescarga: { equals: token }, estado: { equals: 'pagada' } },
    depth: 2, limit: 1,
  })
  const orden = docs[0]
  const casa = orden && typeof orden.casa === 'object' ? orden.casa : null
  const zip = casa?.paquete?.zip
  if (!zip || typeof zip !== 'object' || !zip.filename) {
    return NextResponse.json({ error: 'Descarga no disponible' }, { status: 404 })
  }
  return NextResponse.json({ url: await enlaceFirmado(zip.filename) })
}
```

- [ ] **Step 2: Verificar** — con una orden marcada `pagada` a mano en el admin: `curl http://localhost:3000/api/descarga/<token>/enlace` → `{url}` que descarga el ZIP; token inventado → 404.

- [ ] **Step 3: Commit**

```bash
git add src/lib/r2Firmas.ts src/app/api package.json package-lock.json
git commit -m "M3: estado de orden y enlaces firmados de descarga"
```

---

### Task 7: `HojaCompra.tsx` + páginas `/gracias` y `/descarga/[token]`

**Files:**
- Create: `src/experiencia/HojaCompra.tsx`, `src/app/(web)/gracias/page.tsx`, `src/app/(web)/descarga/[token]/page.tsx`
- Modify: `src/app/(web)/casas/[slug]/page.tsx` (montar `<HojaCompra/>`)

**Interfaces:**
- Consumes: evento `basalto:comprar` (M2), `POST /api/comprar`, `GET /api/ordenes/estado`, `GET /api/descarga/[token]/enlace`.
- Produces: hoja deslizante de compra; `/gracias?orden=` con polling cada 2 s (máx 90 s) que muestra: pagada → "Es tuya" + botón a `/descarga/[token]`; fallida → reintento (vuelve a abrir la hoja); pendiente → "Confirmando tu pago…".

- [ ] **Step 1: `HojaCompra.tsx`** (client, montado en la página de casa):

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { Casa } from '@/payload-types'
import { calcularMonto } from '@/lib/precios'
import s from './experiencia.module.css'

const clp = (n: number) => '$' + n.toLocaleString('es-CL')

export function HojaCompra({ casa }: { casa: Casa }) {
  const [abierta, setAbierta] = useState(false)
  const [email, setEmail] = useState('')
  const [conAjustes, setConAjustes] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const abrir = () => setAbierta(true)
    window.addEventListener('basalto:comprar', abrir)
    return () => window.removeEventListener('basalto:comprar', abrir)
  }, [])

  const pagar = async () => {
    if (!/.+@.+\..+/.test(email)) { setError('Escribe un correo válido: ahí llegan tus planos.'); return }
    setEnviando(true); setError('')
    const r = await fetch('/api/comprar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ casaId: casa.id, email, conAjustes, descripcionAjustes: descripcion }),
    })
    if (!r.ok) { setError('No pudimos iniciar el pago. Intenta de nuevo.'); setEnviando(false); return }
    const { initPoint } = await r.json()
    window.location.href = initPoint
  }

  if (!abierta) return null
  const monto = calcularMonto(casa, conAjustes)
  return (
    <div className={s.hojaFondo} onClick={() => setAbierta(false)}>
      <div className={s.hoja} role="dialog" aria-label="Comprar los planos" onClick={(e) => e.stopPropagation()}>
        <h3>Casa {casa.nombre}</h3>
        <p className={s.hojaDetalle}>Planos completos: PDF + DWG + especificaciones. Descarga inmediata.</p>
        <label className={s.hojaAjustes}>
          <input type="checkbox" checked={conAjustes} onChange={(e) => setConAjustes(e.target.checked)} />
          <span>Quiero ajustes menores (+{clp(casa.precioAjustes ?? 0)}) — te contactamos para trabajarlos</span>
        </label>
        {conAjustes && (
          <textarea placeholder="Cuéntanos qué te gustaría ajustar (ej: agrandar la terraza, invertir la cocina…)"
                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        )}
        <input type="email" placeholder="Tu correo (ahí llegan los planos)" value={email}
               onChange={(e) => setEmail(e.target.value)} />
        {error && <p className={s.hojaError}>{error}</p>}
        <button className={s.btn} disabled={enviando} onClick={pagar}>
          {enviando ? 'Abriendo Mercado Pago…' : `Pagar ${clp(monto)} con Mercado Pago`}
        </button>
      </div>
    </div>
  )
}
```

CSS `.hojaFondo` (overlay oscuro), `.hoja` (sheet inferior, fondo `--bg`, sin bordes redondeados grandes — lenguaje del sitio), `.hojaError` terracota.

- [ ] **Step 2: `/gracias`** — página client con `useSearchParams`; polling `GET /api/ordenes/estado?id=` cada 2 s hasta `pagada`/`fallida` o 90 s; los tres estados con el tono del sitio ("Es tuya. También te lo enviamos al correo."). Botón principal → `/descarga/[token]`.

- [ ] **Step 3: `/descarga/[token]`** — RSC que busca la orden pagada por token (404 amable si no existe: "Este enlace no corresponde a una compra. ¿Necesitas ayuda? Escríbenos."); muestra la casa, qué incluye, y un botón "Descargar paquete" (client) que pide `/api/descarga/[token]/enlace` y navega a la URL firmada.

- [ ] **Step 4: Verificar** — flujo con tarjetas de prueba de MP sandbox (aprobada: `5031 7557 3453 0604` APRO; rechazada: OTHE). Expected: aprobada → `/gracias` pasa a "Es tuya" + correo llega + descarga funciona; rechazada → estado fallida + reintento visible.

- [ ] **Step 5: Commit**

```bash
git add src/experiencia src/app
git commit -m "M3: hoja de compra, gracias con polling y descarga permanente"
```

---

### Task 8: Verificación end-to-end en Vercel (sandbox)

**Files:**
- Modify: env vars en Vercel

- [ ] **Step 1: Configurar** — agregar `MP_ACCESS_TOKEN` (prueba), `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_URL` (URL real de Vercel) en el proyecto; configurar la URL del webhook en el panel de MP: `https://<app>.vercel.app/api/webhooks/mp`.

- [ ] **Step 2: Compra completa en producción-sandbox** — comprar la Pitrufquén con tarjeta de prueba desde el celular. Expected: redirect MP → `/gracias` → "Es tuya" → correo → ZIP descargado. Orden `pagada` en el admin con `mpPaymentId`.

- [ ] **Step 3: Casos borde** — pagar y reenviar la notificación desde el panel MP (sin segundo correo); tarjeta rechazada (orden `fallida`); token inventado en `/descarga/xyz` (404 amable).

- [ ] **Step 4: Commit y tag**

```bash
git add -A && git commit -m "M3 completo: compra y entrega funcionando en sandbox" --allow-empty
git tag m3-compra
```

**Paso posterior (usuario):** cambiar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` a credenciales de producción cuando la cuenta MP esté lista.

---

## Self-Review (ya aplicado)

- **Cobertura spec §7:** hoja (T7), preference+orden (T3), webhook idempotente (T5), gracias con polling (T7), descarga permanente con firmas 15 min (T6), reintento y 404 amable (T7–T8), correos (T4). Boleta/factura y cuentas: fuera de alcance v1, como el spec.
- **Sin placeholders:** todo endpoint y lib con código completo; verificaciones con tarjetas de prueba concretas.
- **Consistencia:** campos de `ordenes` usados EXACTAMENTE como los definió M1 Task 6; `calcularMonto` compartido entre servidor y HojaCompra; evento `basalto:comprar` como lo emite M2 Task 10.
