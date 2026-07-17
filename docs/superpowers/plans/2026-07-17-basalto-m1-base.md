# Basalto Web M1 — Base (App + CMS + Pipeline) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicación Next.js + Payload CMS desplegable en Vercel, con las colecciones del spec, almacenamiento R2, pipeline de assets, y la Casa Pitrufquén cargada completa.

**Architecture:** Una sola app Next.js (App Router) con Payload 3 embebido en `/admin`; Postgres en Neon; archivos en Cloudflare R2 (bucket público para renders/GLB, privado para ZIPs); scripts locales de pipeline para convertir los assets de `F:\03 - Casas\`.

**Tech Stack:** Next.js 15, Payload 3 (`@payloadcms/db-postgres`, `@payloadcms/storage-s3`), TypeScript, sharp, archiver, Vitest, Blender CLI (portable) + `@gltf-transform/cli`, Vercel.

**Spec:** `docs/superpowers/specs/2026-07-16-basalto-web-design.md` (leerlo antes de empezar; los planes M2–M4 se escriben al cerrar cada fase).

## Global Constraints

- Node ≥ 20. Gestor de paquetes: **npm**.
- Todo el texto visible (admin incluido) en **español de Chile**; sin jerga técnica en labels.
- Identidad: acento único terracota `#C2552E`; tipografías Archivo + IBM Plex Mono (M2 las usa; M1 solo admin).
- Assets fuente: `F:\03 - Casas\001 Casa Pitrufquen 180m2\` (no mover ni modificar los originales).
- El repo vive en OneDrive: si `npm install` falla con EPERM/archivos bloqueados, **pausar la sincronización de OneDrive** durante la instalación (`node_modules/` ya está en `.gitignore`).
- Commits frecuentes, mensajes en español, sufijo `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Variables de entorno (definidas en Task 1 y usadas en todo el plan): `DATABASE_URI`, `PAYLOAD_SECRET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`, `S3_REGION=auto`.

## File Structure (resultado de M1)

```
basalto-web/                     (raíz del repo actual)
├─ src/
│  ├─ app/(payload)/…            (rutas generadas de Payload/admin)
│  ├─ payload.config.ts          (config central: es, colecciones, storage)
│  ├─ collections/
│  │  ├─ Usuarios.ts
│  │  ├─ Medios.ts               (imágenes públicas + GLB)
│  │  ├─ Paquetes.ts             (ZIPs privados)
│  │  ├─ Casas.ts                (modelo completo del spec §6)
│  │  └─ Ordenes.ts
│  └─ lib/
│     ├─ slug.ts                 (generarSlug)
│     ├─ poligono.ts             (validarPoligono)
│     └─ token.ts                (generarToken)
├─ tests/
│  ├─ slug.test.ts
│  ├─ poligono.test.ts
│  └─ token.test.ts
├─ scripts/
│  ├─ preparar-zip.mjs           (F:\ → paquete.zip)
│  ├─ preparar-webp.mjs          (renders JPG → WebP)
│  ├─ exportar-glb.py            (script Blender: dae → glb)
│  └─ README-pipeline.md         (cómo correr el pipeline por casa)
├─ .env.example
└─ vitest.config.ts
```

---

### Task 1: Scaffold Next.js + Payload + Neon

**Files:**
- Create: proyecto completo vía `create-payload-app` (movido a la raíz del repo)
- Create: `.env`, `.env.example`

**Interfaces:**
- Produces: app corriendo en `localhost:3000`, admin en `/admin`, `src/payload.config.ts` como punto central que las Tasks 3–7 modifican.

- [ ] **Step 1: Crear la base de datos en Neon**

Manual (el usuario o el ejecutor con acceso): crear proyecto "basalto-web" en https://neon.tech (región AWS us-east-1 o sa-east-1), copiar el connection string pooled (`postgresql://…@…-pooler…/neondb?sslmode=require`).

- [ ] **Step 2: Scaffold en carpeta temporal y mover a la raíz**

```powershell
cd "$env:USERPROFILE\Desktop"
npx create-payload-app@latest basalto-tmp -t blank --db postgres --no-deps
robocopy basalto-tmp "C:\Users\lucia\OneDrive - Adventistas\Escritorio\Basalto WEB" /E /XF .gitignore /XD node_modules .git
Remove-Item -Recurse -Force basalto-tmp
```

Nota: no sobrescribir el `.gitignore` existente; anexar a mano las líneas del template que falten (`/node_modules`, `/.next`, `/media`).

- [ ] **Step 3: Instalar dependencias**

```powershell
cd "C:\Users\lucia\OneDrive - Adventistas\Escritorio\Basalto WEB"
npm install
```

Si falla con EPERM: pausar OneDrive y reintentar.

- [ ] **Step 4: Configurar `.env` y `.env.example`**

`.env` (real) y `.env.example` (sin valores):

```env
DATABASE_URI=postgresql://usuario:pass@host-pooler.neon.tech/neondb?sslmode=require
PAYLOAD_SECRET=<openssl rand -hex 32>
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_PUBLIC=
S3_BUCKET_PRIVATE=
S3_REGION=auto
```

- [ ] **Step 5: Verificar arranque y primer usuario**

Run: `npm run dev` → abrir `http://localhost:3000/admin`
Expected: pantalla "Create first user"; crear usuario admin (correo del usuario). Las tablas se crean solas en Neon (push mode en dev).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "M1: scaffold Next.js + Payload 3 con Postgres (Neon)"
```

---

### Task 2: Admin en español con marca Basalto

**Files:**
- Modify: `src/payload.config.ts`

**Interfaces:**
- Consumes: config del Task 1.
- Produces: admin con `i18n` español y título "Basalto".

- [ ] **Step 1: Configurar i18n y metadatos**

En `src/payload.config.ts`:

```ts
import { es } from '@payloadcms/translations/languages/es'

export default buildConfig({
  i18n: { supportedLanguages: { es }, fallbackLanguage: 'es' },
  admin: {
    meta: { titleSuffix: '· Basalto' },
    user: 'usuarios',
  },
  // …resto igual
})
```

```powershell
npm install @payloadcms/translations
```

- [ ] **Step 2: Verificar**

Run: `npm run dev` → `/admin`
Expected: UI del panel en español; pestaña del navegador termina en "· Basalto".

- [ ] **Step 3: Commit**

```bash
git add src/payload.config.ts package.json package-lock.json
git commit -m "M1: admin de Payload en español con marca Basalto"
```

---

### Task 3: Utilidades puras con TDD (slug, polígono, token)

**Files:**
- Create: `vitest.config.ts`, `src/lib/slug.ts`, `src/lib/poligono.ts`, `src/lib/token.ts`
- Test: `tests/slug.test.ts`, `tests/poligono.test.ts`, `tests/token.test.ts`

**Interfaces:**
- Produces:
  - `generarSlug(nombre: string): string` — minúsculas, sin tildes, espacios→guiones.
  - `validarPoligono(value: unknown): true | string` — `true` si es `[[x,y],…]` con ≥3 vértices numéricos; si no, mensaje de error en español (contrato de `validate` de Payload).
  - `generarToken(): string` — 43 chars URL-safe (32 bytes base64url), únicos.

- [ ] **Step 1: Instalar y configurar Vitest**

```powershell
npm install -D vitest
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } })
```

En `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Escribir los tests (deben fallar)**

`tests/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generarSlug } from '../src/lib/slug'

describe('generarSlug', () => {
  it('convierte nombre con tildes y espacios', () => {
    expect(generarSlug('Casa María Pinto')).toBe('casa-maria-pinto')
  })
  it('limpia caracteres raros y ñ', () => {
    expect(generarSlug('Ñuñoa  180m² (v2)')).toBe('nunoa-180m2-v2')
  })
})
```

`tests/poligono.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validarPoligono } from '../src/lib/poligono'

describe('validarPoligono', () => {
  it('acepta triángulo válido', () => {
    expect(validarPoligono([[0, 0], [10, 0], [10, 10]])).toBe(true)
  })
  it('rechaza menos de 3 vértices', () => {
    expect(validarPoligono([[0, 0], [1, 1]])).toMatch(/al menos 3/)
  })
  it('rechaza vértices no numéricos', () => {
    expect(validarPoligono([[0, 0], ['a', 1], [2, 2]])).toMatch(/números/)
  })
  it('rechaza cosas que no son arreglo', () => {
    expect(validarPoligono('hola')).toMatch(/arreglo/)
  })
})
```

`tests/token.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generarToken } from '../src/lib/token'

describe('generarToken', () => {
  it('genera 43 caracteres URL-safe', () => {
    const t = generarToken()
    expect(t).toHaveLength(43)
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/)
  })
  it('no se repite en 1000 llamadas', () => {
    const set = new Set(Array.from({ length: 1000 }, generarToken))
    expect(set.size).toBe(1000)
  })
})
```

- [ ] **Step 3: Verificar que fallan**

Run: `npm test`
Expected: FAIL — "Cannot find module '../src/lib/slug'" (y equivalentes).

- [ ] **Step 4: Implementar**

`src/lib/slug.ts`:

```ts
export function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

`src/lib/poligono.ts`:

```ts
export function validarPoligono(value: unknown): true | string {
  if (!Array.isArray(value)) return 'El polígono debe ser un arreglo de puntos [[x,y],…]'
  if (value.length < 3) return 'El polígono necesita al menos 3 vértices'
  for (const p of value) {
    if (!Array.isArray(p) || p.length !== 2 || typeof p[0] !== 'number' || typeof p[1] !== 'number')
      return 'Cada vértice debe ser un par de números [x,y]'
  }
  return true
}
```

`src/lib/token.ts`:

```ts
import { randomBytes } from 'crypto'
export function generarToken(): string {
  return randomBytes(32).toString('base64url')
}
```

- [ ] **Step 5: Verificar que pasan**

Run: `npm test`
Expected: 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib tests
git commit -m "M1: utilidades slug/poligono/token con TDD"
```

---

### Task 4: Colecciones de archivos — Medios (público) y Paquetes (privado)

**Files:**
- Create: `src/collections/Medios.ts`, `src/collections/Paquetes.ts`
- Modify: `src/payload.config.ts` (registrar colecciones; renombrar la colección users generada a `Usuarios.ts` con slug `usuarios`)

**Interfaces:**
- Produces: slugs `medios` y `paquetes`; `medios` acepta imágenes y `.glb` con variantes `tarjeta` (800px) y `pantalla` (1600px) en WebP; `paquetes` acepta `.zip` sin acceso público de lectura. Las Tasks 5–6 referencian estos slugs vía `relationTo`.

- [ ] **Step 1: Escribir las colecciones**

`src/collections/Medios.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const Medios: CollectionConfig = {
  slug: 'medios',
  labels: { singular: 'Medio', plural: 'Medios' },
  access: { read: () => true },
  upload: {
    mimeTypes: ['image/*', 'model/gltf-binary'],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'tarjeta', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'pantalla', width: 1600, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
  },
  fields: [{ name: 'alt', label: 'Texto alternativo', type: 'text' }],
}
```

`src/collections/Paquetes.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const Paquetes: CollectionConfig = {
  slug: 'paquetes',
  labels: { singular: 'Paquete', plural: 'Paquetes' },
  access: { read: ({ req }) => Boolean(req.user) }, // solo admin; el comprador usa enlaces firmados (M3)
  upload: { mimeTypes: ['application/zip', 'application/x-zip-compressed'] },
  fields: [{ name: 'nota', label: 'Nota interna', type: 'text' }],
}
```

Registrar ambas en `payload.config.ts` (`collections: [Usuarios, Medios, Paquetes]`).

- [ ] **Step 2: Verificar en el admin**

Run: `npm run dev` → `/admin`
Expected: colecciones "Medios" y "Paquetes" visibles; subir un JPG a Medios genera variantes WebP; subir un ZIP a Paquetes funciona; abrir la URL del ZIP sin sesión → 403/401.

- [ ] **Step 3: Commit**

```bash
git add src/collections src/payload.config.ts
git commit -m "M1: colecciones Medios (público, WebP) y Paquetes (privado)"
```

---

### Task 5: Colección Casas (modelo completo del spec)

**Files:**
- Create: `src/collections/Casas.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Consumes: `generarSlug`, `validarPoligono` (Task 3); slugs `medios`/`paquetes` (Task 4).
- Produces: slug `casas` con la forma exacta del spec §6. M2 leerá estos campos por API; el plan M2 depende de estos nombres — no renombrar sin actualizar el spec.

- [ ] **Step 1: Escribir la colección**

`src/collections/Casas.ts` (completa):

```ts
import type { CollectionConfig } from 'payload'
import { generarSlug } from '../lib/slug'
import { validarPoligono } from '../lib/poligono'

export const Casas: CollectionConfig = {
  slug: 'casas',
  labels: { singular: 'Casa', plural: 'Casas' },
  admin: { useAsTitle: 'nombre', defaultColumns: ['numero', 'nombre', 'publicada', 'precio'] },
  access: { read: () => true },
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'numero', label: 'Número (ej: 001)', type: 'text', required: true, unique: true },
    {
      name: 'slug', type: 'text', unique: true, admin: { readOnly: true },
      hooks: { beforeValidate: [({ data }) => generarSlug(data?.nombre ?? '')] },
    },
    { name: 'ubicacion', label: 'Ubicación (ej: La Araucanía)', type: 'text' },
    { name: 'publicada', label: 'Publicada en la web', type: 'checkbox', defaultValue: false },
    {
      name: 'specs', label: 'Datos de la casa', type: 'group',
      fields: [
        { name: 'superficie', label: 'Superficie (m²)', type: 'number', required: true },
        { name: 'pisos', label: 'Pisos', type: 'number', required: true },
        { name: 'dormitorios', label: 'Dormitorios', type: 'number', required: true },
        { name: 'banos', label: 'Baños', type: 'number', required: true },
      ],
    },
    { name: 'precio', label: 'Precio (CLP)', type: 'number', required: true },
    { name: 'precioOferta', label: 'Precio oferta (CLP, opcional)', type: 'number' },
    { name: 'precioAjustes', label: 'Precio add-on ajustes menores (CLP)', type: 'number', defaultValue: 150000 },
    {
      name: 'coordenadas', label: 'Ubicación para el sol', type: 'group',
      fields: [
        { name: 'lat', type: 'number', defaultValue: -38.98 },
        { name: 'lng', type: 'number', defaultValue: -72.65 },
      ],
    },
    {
      name: 'momentos', label: 'La experiencia (Un día en la casa)', type: 'group',
      fields: [
        {
          name: 'llegada', label: '16:00 · Llegas', type: 'group',
          fields: [
            { name: 'imagen', type: 'upload', relationTo: 'medios' },
            { name: 'relato', label: 'Relato de llegada', type: 'textarea' },
          ],
        },
        {
          name: 'visita', label: '17:00 · La caminas (escenas)', type: 'array',
          fields: [
            { name: 'imagen', type: 'upload', relationTo: 'medios', required: true },
            { name: 'titulo', label: 'Título de la escena', type: 'text', required: true },
            { name: 'frase', label: 'Frase (1-2 líneas)', type: 'textarea', required: true },
            { name: 'puntoX', label: 'Punto en minimapa X (0-100)', type: 'number', required: true },
            { name: 'puntoY', label: 'Punto en minimapa Y (0-100)', type: 'number', required: true },
          ],
        },
        {
          name: 'plano', label: '18:30 · Lees el plano', type: 'group',
          fields: [
            {
              name: 'muros', label: 'Muros (JSON de segmentos)', type: 'json',
              admin: { description: 'Formato: [{"de":[x,y],"a":[x,y],"grosor":3}] en metros desde esquina sup-izq' },
            },
            {
              name: 'recintos', label: 'Recintos', type: 'array',
              fields: [
                { name: 'nombre', type: 'text', required: true },
                { name: 'superficie', label: 'Superficie (m²)', type: 'number', required: true },
                {
                  name: 'poligono', label: 'Polígono (JSON [[x,y],…] en metros)', type: 'json', required: true,
                  validate: (value: unknown) => validarPoligono(value),
                },
                { name: 'render', type: 'upload', relationTo: 'medios' },
                { name: 'frase', type: 'textarea' },
              ],
            },
          ],
        },
        {
          name: 'maqueta', label: '19:30 · El sol se pone (maqueta 3D)', type: 'group',
          fields: [{ name: 'glb', label: 'Modelo GLB', type: 'upload', relationTo: 'medios' }],
        },
        {
          name: 'fotosObra', label: '21:00 · La verdad (obra real)', type: 'array',
          fields: [
            { name: 'imagen', type: 'upload', relationTo: 'medios', required: true },
            { name: 'lugar', type: 'text' },
            { name: 'fecha', type: 'text', admin: { description: 'ej: 13.02.2023' } },
          ],
        },
      ],
    },
    {
      name: 'materiales', label: 'Materiales', type: 'array',
      fields: [
        { name: 'nombre', type: 'text', required: true },
        { name: 'frase', label: 'Explicación simple', type: 'textarea', required: true },
        { name: 'imagen', type: 'upload', relationTo: 'medios' },
      ],
    },
    {
      name: 'paquete', label: 'El paquete descargable', type: 'group',
      fields: [
        { name: 'zip', label: 'ZIP del paquete', type: 'upload', relationTo: 'paquetes' },
        { name: 'laminas', label: 'Nº de láminas PDF', type: 'number' },
        { name: 'incluyeDwg', label: 'Incluye DWG', type: 'checkbox', defaultValue: true },
        { name: 'incluyeEett', label: 'Incluye EETT', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'faq', label: 'Preguntas frecuentes', type: 'array',
      fields: [
        { name: 'pregunta', type: 'text', required: true },
        { name: 'respuesta', type: 'textarea', required: true },
      ],
    },
  ],
}
```

Registrar en `payload.config.ts`.

- [ ] **Step 2: Verificar validación del polígono en el admin**

Run: `npm run dev` → crear una Casa de prueba, en un recinto pegar `[[0,0],[1,1]]`.
Expected: error "El polígono necesita al menos 3 vértices" al guardar; con `[[0,0],[6,0],[6,3.7],[0,3.7]]` guarda bien y el slug se genera solo.

- [ ] **Step 3: Commit**

```bash
git add src/collections/Casas.ts src/payload.config.ts
git commit -m "M1: colección Casas con momentos, plano interactivo y paquete"
```

---

### Task 6: Colección Órdenes

**Files:**
- Create: `src/collections/Ordenes.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Consumes: `generarToken` (Task 3), slug `casas` (Task 5).
- Produces: slug `ordenes` con estados `pendiente|pagada|fallida` y `tokenDescarga` generado al crear. M3 (Mercado Pago) usará exactamente estos campos: `email`, `casa`, `monto`, `conAjustes`, `descripcionAjustes`, `estado`, `mpPreferenceId`, `mpPaymentId`, `tokenDescarga`.

- [ ] **Step 1: Escribir la colección**

`src/collections/Ordenes.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { generarToken } from '../lib/token'

export const Ordenes: CollectionConfig = {
  slug: 'ordenes',
  labels: { singular: 'Orden', plural: 'Órdenes' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'estado', 'monto', 'createdAt'] },
  access: { read: ({ req }) => Boolean(req.user), create: () => true, update: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'email', label: 'Correo del comprador', type: 'email', required: true },
    { name: 'casa', type: 'relationship', relationTo: 'casas', required: true },
    { name: 'monto', label: 'Monto (CLP)', type: 'number', required: true },
    { name: 'conAjustes', label: 'Incluye ajustes menores', type: 'checkbox', defaultValue: false },
    { name: 'descripcionAjustes', label: 'Qué quiere ajustar', type: 'textarea' },
    {
      name: 'estado', type: 'select', defaultValue: 'pendiente', required: true,
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Pagada', value: 'pagada' },
        { label: 'Fallida', value: 'fallida' },
      ],
    },
    { name: 'mpPreferenceId', label: 'MP preference', type: 'text', admin: { readOnly: true } },
    { name: 'mpPaymentId', label: 'MP payment', type: 'text', admin: { readOnly: true } },
    {
      name: 'tokenDescarga', type: 'text', unique: true, admin: { readOnly: true },
      hooks: { beforeValidate: [({ value }) => value ?? generarToken()] },
    },
  ],
}
```

Registrar en `payload.config.ts`.

- [ ] **Step 2: Verificar**

Run: `npm run dev` → crear una Orden de prueba en el admin.
Expected: `tokenDescarga` aparece autogenerado (43 chars), estado "Pendiente".

- [ ] **Step 3: Commit**

```bash
git add src/collections/Ordenes.ts src/payload.config.ts
git commit -m "M1: colección Órdenes con token de descarga"
```

---

### Task 7: Almacenamiento en Cloudflare R2

**Files:**
- Modify: `src/payload.config.ts`
- Modify: `.env`, `.env.example` (valores R2)

**Interfaces:**
- Consumes: colecciones `medios`/`paquetes` (Task 4).
- Produces: uploads persistidos en R2 — bucket público sirve `medios` por URL pública; `paquetes` queda en bucket privado (solo enlaces firmados en M3). Vercel deja de necesitar disco.

- [ ] **Step 1: Crear buckets y credenciales (manual)**

En Cloudflare: crear buckets `basalto-publico` (habilitar acceso público / dominio r2.dev) y `basalto-privado` (sin acceso público). Crear API Token S3 con lectura/escritura a ambos. Completar `.env`.

- [ ] **Step 2: Configurar el plugin**

```powershell
npm install @payloadcms/storage-s3
```

En `src/payload.config.ts`:

```ts
import { s3Storage } from '@payloadcms/storage-s3'

// dentro de buildConfig({ plugins: [ … ] })
s3Storage({
  collections: { medios: true },
  bucket: process.env.S3_BUCKET_PUBLIC!,
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  },
}),
s3Storage({
  collections: { paquetes: true },
  bucket: process.env.S3_BUCKET_PRIVATE!,
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  },
}),
```

- [ ] **Step 3: Verificar**

Run: `npm run dev` → subir una imagen a Medios y un ZIP a Paquetes.
Expected: los objetos aparecen en los buckets R2 (dashboard de Cloudflare); la imagen se sirve en el admin; el ZIP no es accesible por URL pública del bucket privado.

- [ ] **Step 4: Commit**

```bash
git add src/payload.config.ts .env.example package.json package-lock.json
git commit -m "M1: almacenamiento R2 (publico/privado) via storage-s3"
```

---

### Task 8: Pipeline — ZIP del paquete (`preparar-zip.mjs`)

**Files:**
- Create: `scripts/preparar-zip.mjs`, `scripts/README-pipeline.md`

**Interfaces:**
- Produces: `node scripts/preparar-zip.mjs "<carpeta casa en F:>" <salida.zip>` — empaqueta `01 - Planos*` (PDF + DWG) y `03 - EETT` en un ZIP con carpetas `PDF/`, `DWG/`, `EETT/`.

- [ ] **Step 1: Escribir el script**

```powershell
npm install -D archiver
```

`scripts/preparar-zip.mjs`:

```js
import archiver from 'archiver'
import { createWriteStream, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const [origen, salida] = process.argv.slice(2)
if (!origen || !salida) {
  console.error('Uso: node scripts/preparar-zip.mjs "<carpeta casa>" <salida.zip>')
  process.exit(1)
}

// localizar subcarpetas aunque el nombre varíe entre casas (01 - Planos para descargar / Planos PDF / …)
function buscar(prefijo) {
  return readdirSync(origen).find((d) => d.toLowerCase().startsWith(prefijo))
}
const carpetaPlanos = buscar('01')
const carpetaEett = buscar('03')
if (!carpetaPlanos) { console.error('No encontré la carpeta 01 - Planos'); process.exit(1) }

const zip = archiver('zip', { zlib: { level: 9 } })
zip.pipe(createWriteStream(salida))

function agregar(dir, destino, filtro) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) agregar(p, `${destino}/${f}`, filtro)
    else if (filtro(f)) zip.file(p, { name: `${destino}/${f}` })
  }
}

agregar(join(origen, carpetaPlanos), 'PDF', (f) => f.toLowerCase().endsWith('.pdf'))
agregar(join(origen, carpetaPlanos), 'DWG', (f) => f.toLowerCase().endsWith('.dwg'))
if (carpetaEett && existsSync(join(origen, carpetaEett))) {
  agregar(join(origen, carpetaEett), 'EETT', () => true)
}

zip.finalize().then(() => console.log(`OK → ${salida}`))
```

- [ ] **Step 2: Verificar contra la Pitrufquén**

Run:
```powershell
node scripts/preparar-zip.mjs "F:\03 - Casas\001 Casa Pitrufquen 180m2" pitrufquen-paquete.zip
```
Expected: `OK → pitrufquen-paquete.zip`; al abrirlo: carpeta `PDF/` con 13 láminas, `DWG/` con los .dwg, tamaño total 10–20 MB. (EETT de la 001 está vacía: el script no debe fallar.)

- [ ] **Step 3: Documentar y commitear**

`scripts/README-pipeline.md` — sección "1. ZIP del paquete" con el comando anterior.

```bash
git add scripts package.json package-lock.json
git commit -m "M1: pipeline de ZIP del paquete descargable"
```

---

### Task 9: Pipeline — renders a WebP (`preparar-webp.mjs`)

**Files:**
- Create: `scripts/preparar-webp.mjs`
- Modify: `scripts/README-pipeline.md`

**Interfaces:**
- Produces: `node scripts/preparar-webp.mjs <entrada...> --out <dir>` — convierte JPG/PNG a WebP calidad 82, ancho máx 2400px, mismo nombre base. (Payload igual re-procesa al subir; esto reduce el peso de subida y deja copia local optimizada.)

- [ ] **Step 1: Escribir el script**

```powershell
npm install -D sharp
```

`scripts/preparar-webp.mjs`:

```js
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { basename, extname, join } from 'path'

const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const out = outIdx >= 0 ? args[outIdx + 1] : 'webp-out'
const entradas = outIdx >= 0 ? args.slice(0, outIdx) : args
if (!entradas.length) { console.error('Uso: node scripts/preparar-webp.mjs <img...> --out <dir>'); process.exit(1) }
mkdirSync(out, { recursive: true })

for (const e of entradas) {
  const destino = join(out, basename(e, extname(e)) + '.webp')
  await sharp(e).resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(destino)
  console.log(`OK → ${destino}`)
}
```

- [ ] **Step 2: Verificar**

Run:
```powershell
node scripts/preparar-webp.mjs "F:\03 - Casas\001 Casa Pitrufquen 180m2\04 - Vistas\Catalgo adicional (1).jpg" --out webp-out
```
Expected: `webp-out/Catalgo adicional (1).webp` creado, < 400 KB.

- [ ] **Step 3: Commit**

```bash
git add scripts package.json package-lock.json
git commit -m "M1: pipeline de conversion de renders a WebP"
```

---

### Task 10: Pipeline — DAE → GLB comprimido

**Files:**
- Create: `scripts/exportar-glb.py`
- Modify: `scripts/README-pipeline.md`

**Interfaces:**
- Produces: `casa.glb` ≤ 5 MB desde el `.dae` de Archicad, cargable con GLTFLoader (M2 lo consume desde `medios`).

- [ ] **Step 1: Instalar Blender portable (manual, una vez)**

Descargar Blender LTS portable (zip) desde blender.org, descomprimir en `C:\Herramientas\blender\` (fuera de OneDrive). Verificar: `C:\Herramientas\blender\blender.exe --version` → `Blender 4.x`.

- [ ] **Step 2: Escribir el script de Blender**

`scripts/exportar-glb.py`:

```python
# Uso: blender.exe --background --python scripts/exportar-glb.py -- "<entrada.dae>" "<salida.glb>"
import bpy, sys

entrada, salida = sys.argv[sys.argv.index('--') + 1:][:2]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.collada_import(filepath=entrada)

bpy.ops.export_scene.gltf(
    filepath=salida,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_image_format='WEBP',
    export_image_quality=70,
    export_apply=True,
)
print(f'OK -> {salida}')
```

- [ ] **Step 3: Ejecutar y optimizar**

Run:
```powershell
& "C:\Herramientas\blender\blender.exe" --background --python scripts/exportar-glb.py -- "F:\03 - Casas\001 Casa Pitrufquen 180m2\06 - Modelo 3D\CASA PITRUFQUEN MEDITERRANEA.dae" "pitrufquen.glb"
npx @gltf-transform/cli optimize pitrufquen.glb pitrufquen.glb --compress draco --texture-compress webp
npx @gltf-transform/cli inspect pitrufquen.glb
```
Expected: GLB final ≤ 5 MB; `inspect` muestra mallas Draco y texturas WebP sin errores.

- [ ] **Step 4: Documentar y commitear**

Añadir sección "3. Maqueta GLB" al `README-pipeline.md` con los tres comandos y la nota: casas 003 y 007 no tienen `.dae` aún — exportar desde Archicad antes de correr esto.

```bash
git add scripts
git commit -m "M1: pipeline DAE a GLB comprimido (Blender + gltf-transform)"
```

---

### Task 11: Cargar la Casa Pitrufquén completa

**Files:**
- (Sin código nuevo: ejecución del pipeline + carga vía admin)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: documento `casas/001` publicado con TODOS los campos poblados — el dato de prueba real que M2 renderiza.

- [ ] **Step 1: Preparar assets**

Ejecutar Tasks 8–10 para la 001. Renders a subir (desde `04 - Vistas`): `Catalgo adicional (1).jpg` (llegada), `(4)` (terraza), `(2)` (comedor), `(3)` (dormitorio); foto de obra `08 - Fotos Obra\Comprimidas\_LUC4400.jpg`; `pitrufquen.glb`; `pitrufquen-paquete.zip`.

- [ ] **Step 2: Crear la casa en `/admin`**

Datos (de la lámina A1.1 y los mockups v8): nombre "Pitrufquén", numero "001", ubicación "La Araucanía", specs 180/1/4/2, precio 89900, oferta 59900, coordenadas -38.98/-72.65. Momentos: relato de llegada y 3 escenas de visita con sus frases (copiarlas de `.superpowers/brainstorm/374-1784252198/content/detalle-casa-v8-undia.html`), puntos de minimapa (terraza 85/52, comedor 17/69, dormitorio 61/33). Plano: muros y 11 recintos con superficies reales (COCINA 14,27 · LAVANDERÍA 5,32 · BAÑO 1 6,45 · HAB 3 12,42 · HAB 2 13,55 · BAÑO 2 6,53 · COMEDOR 22,92 · LIVING 22,08 · CIRCULACIÓN 5,84 · HAB 1 17,59 · TERRAZA 52,72), polígonos en metros tomados de la geometría del SVG del mockup (escala: 18 m de ancho útil). Materiales (4 del mockup). Paquete: zip + 13 láminas. Publicada: sí.

- [ ] **Step 3: Verificar por API**

Run: `curl http://localhost:3000/api/casas?where[slug][equals]=pitrufquen`
Expected: JSON con la casa completa: specs, 3 escenas, ≥11 recintos, URLs de medios en R2.

- [ ] **Step 4: Commit (si hubo ajustes de config) y respaldo**

```bash
git add -A && git commit -m "M1: ajustes de carga de contenido Pitrufquen" --allow-empty
```

---

### Task 12: Deploy a Vercel

**Files:**
- Modify: variables de entorno en Vercel (dashboard)

**Interfaces:**
- Produces: `https://<proyecto>.vercel.app/admin` funcionando contra Neon + R2 producción.

- [ ] **Step 1: Crear proyecto en Vercel**

`npx vercel link` (o dashboard → Import desde el repo si se sube a GitHub). Framework: Next.js. Configurar TODAS las env vars del `.env` en Vercel (Production + Preview).

- [ ] **Step 2: Verificar build local antes de subir**

Run: `npm run build`
Expected: build exitoso sin errores de tipos.

- [ ] **Step 3: Deploy y smoke test**

Run: `npx vercel --prod`
Expected: URL de producción; `/admin` carga y permite login; la casa Pitrufquén visible en la colección; una imagen de Medios se sirve desde R2.

- [ ] **Step 4: Commit final de M1**

```bash
git add -A
git commit -m "M1 completo: base desplegada en Vercel" --allow-empty
git tag m1-base
```

---

## Self-Review (ya aplicado)

- **Cobertura del spec §5–§6 y §8:** stack completo (Tasks 1–7), pipeline (8–10), contenido real (11), deploy (12). El **editor visual de polígonos** del spec §6 queda como JSON validado en M1; el campo custom de dibujo se planifica en M4 (pulido) — anotado aquí como decisión consciente.
- **Sin placeholders:** cada step tiene código o comando concreto con resultado esperado.
- **Consistencia de nombres:** slugs `usuarios/medios/paquetes/casas/ordenes` y utilidades `generarSlug/validarPoligono/generarToken` usados idénticos en todas las tasks; M3 consumirá los campos de Órdenes tal como están nombrados en Task 6.
