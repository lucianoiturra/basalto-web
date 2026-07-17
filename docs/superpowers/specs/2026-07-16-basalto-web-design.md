# Basalto Web — Documento de diseño

**Fecha:** 2026-07-16
**Estado:** Aprobado en brainstorming (mockups interactivos v8 "Un día en la casa")
**Mockups:** `.superpowers/brainstorm/374-1784252198/content/` (v8 = versión validada)

## 1. Objetivo y modelo de negocio

Web de venta de planos de casas prediseñados de Basalto Arquitectura, dirigida a
personas **no técnicas** en Chile que tienen terreno y quieren construir. Modelo:
catálogo online, pago inmediato, **paquete completo descargable al instante**
(láminas PDF + DWG editables + EETT), con add-on opcional de **ajustes menores**
pagado en el checkout. Catálogo inicial: 7 casas (ver `Casas.md`), administradas
por un CMS para ir sumando más.

**Criterio de éxito:** una persona sin conocimientos técnicos entiende qué compra,
se emociona con la casa, entiende cómo se asolea y qué recibe, y descarga sus
archivos a los segundos de pagar — todo desde el celular.

## 2. Concepto de experiencia: "Un día en la casa"

La página de cada casa **no es una ficha de producto: es una visita de una tarde
completa**. No hay secciones con cajas; hay un lienzo continuo donde el fondo pasa
gradualmente de la luz de las 16:00 al crepúsculo y a la noche a medida que el
visitante baja. El precio aparece cuando el día termina.

### Momentos (en orden de scroll)

| Hora | Momento | Contenido |
|------|---------|-----------|
| 16:00 · LLEGAS | Portada | Nombre de la casa (display expandido), relato de llegada, datos clave en mono, imagen a sangre fundida con el fondo |
| 17:00 · LA CAMINAS | La visita | Scrollytelling con imágenes fijas que se funden (Ken Burns sutil), subtítulos por escena y **minimapa "estás aquí"** con punto terracota sobre la planta |
| 18:30 · LEES EL PLANO | La planta | **Plano SVG nativo** (no imagen): se dibuja solo al llegar, recintos tocables con superficies reales; al tocar, el render del espacio aparece a sangre. Las escenas de la visita quedan numeradas sobre el plano |
| 19:30 · EL SOL SE PONE | La maqueta | **Visor 3D real** (GLB del modelo Archicad), carga solo a pedido. Slider de hora + estación mueven un sol real con sombras sobre la casa; el fondo del canvas se sincroniza con el cielo de la página |
| 21:00 · LA VERDAD | La prueba | Foto real de obra construida ("De estas láminas, esta casa"), cuando exista |
| 22:00 · LA DECIDES | Ficha y compra | Ficha en líneas abiertas (sin tarjetas), precio, botón brasa con glow, nota de confianza, WhatsApp |

### Elementos transversales

- **El hilo:** línea vertical en el borde izquierdo con un punto terracota que
  recorre toda la página mostrando la hora (16:00→22:30). El visitante "es" el punto.
- **El cielo continuo:** variables CSS (`--bg`, `--fg`, `--dim`) interpoladas por
  scroll entre 5 keyframes de color (tarde clara → dorada → crepúsculo → anochecer → noche).
- **Cero chrome:** sin tarjetas, bordes ni títulos enmarcados. Imágenes con
  `mask-image` para fundirse con el fondo. Momentos marcados solo con hora en mono.
- **Barra de compra fija** (precio + botón) aparece recién después de La prueba.
- **Degradación por contenido:** casa sin maqueta GLB → se omite el momento 19:30
  (queda solo el diagrama de sol simple); sin foto de obra → se omite La prueba;
  sin render de un recinto → el recinto muestra solo nombre/m²/frase.

## 3. Identidad visual

- **Paleta día→noche** (keyframes del cielo): de hueso cálido `#EFE9DD` a noche
  `#0E0F0D`; texto de tinta `#26241E` a niebla `#E8E4DC`; acento único **terracota
  `#C2552E`** (acciones, sol, "estás aquí").
- **Tipografía:** Archivo (variable; display en `font-stretch:125%` peso 800 para
  títulos, 400/600 texto) + IBM Plex Mono (horas, códigos, cifras, precios).
  Cuando existan licencias de Reign/Aeonik (fuentes de marca), se sustituyen 1:1.
- **Logo:** monograma BA (`Identidad visual Basalto/Logo.png`) + wordmark BASALTO
  espaciado.
- **Voz:** segunda persona, relato de visita, cero jerga (todo término técnico se
  explica: "Cortes — la casa 'rebanada' para ver alturas").

## 4. Páginas y rutas

| Ruta | Contenido |
|------|-----------|
| `/` | Portada: una casa al atardecer + "elige qué casa visitar" (catálogo) + cómo funciona (elige→paga→descarga) + quiénes somos breve + FAQ + WhatsApp |
| `/casas` | Catálogo: tarjetas a sangre (render hora dorada, nombre, specs mono, precio), filtros simples (m², pisos, dormitorios) |
| `/casas/[slug]` | La experiencia "Un día en la casa" (sección 2) |
| `/gracias?orden=` | Retorno post-pago: estado + enlaces de descarga + aviso de correo enviado |
| `/descarga/[token]` | Página permanente de descargas del comprador |
| `/terminos`, `/privacidad` | Legales |
| `/admin` | Payload CMS (login) |

Mobile-first: todo se diseña para 390 px primero; en desktop el lienzo se centra
con la imaginería a ancho completo y el texto en columna.

## 5. Arquitectura técnica

- **Next.js (App Router) + Payload CMS 3 embebido** — una sola app desplegada en
  **Vercel**. Web pública con SSR/ISR; `/admin` es el panel Payload en español.
- **Base de datos:** Neon Postgres (adaptador oficial de Payload).
- **Archivos:** Cloudflare R2 vía adaptador S3 de Payload. Dos buckets/prefijos:
  público (renders WebP, planos-datos, GLB) y **privado** (ZIP de paquetes) con
  **enlaces firmados** de ~15 min generados on-demand.
- **Pagos:** **Mercado Pago Checkout Pro** (CLP): se crea una *preference* por
  orden, redirect, y **webhook** confirma el pago (verificación de firma,
  idempotente por `payment_id`).
- **Email:** Resend — correo de entrega con enlace `/descarga/[token]` y correo
  de notificación al admin cuando hay add-on de ajustes.
- **3D:** three.js (GLTFLoader + OrbitControls) con carga diferida (dynamic
  import al tocar "Cargar maqueta"); sol con `suncalc` (posición solar real para
  lat/lng del sur de Chile, por hora y fecha/estación) → DirectionalLight con
  sombras. Sin React Three Fiber: el visor es un componente aislado vanilla.
- **Analítica:** Vercel Analytics.

## 6. Modelo de datos (colecciones Payload)

**Casas** — `nombre`, `numero` (001…), `slug`, `ubicacion`, `publicada`;
`specs` (m², pisos, dormitorios, baños); `precio`, `precioOferta?`;
`precioAjustes` (add-on); `lat/lng` (para el sol);
`momentos`: `llegada` (imagen + relato), `visita[]` (imagen, título, frase,
posición del punto en minimapa), `plano` (JSON de segmentos de muro/puertas creado con el editor custom del admin,
del que se renderiza el SVG + `recintos[]` {nombre, superficie, polígono, render?, frase}),
`maquetaGLB?`, `fotosObra[]?`, `materiales[]` {nombre, frase, imagen?};
`paquete` (ZIP privado, resumen: nº láminas, DWG, EETT);
`faq[]?`. Nota admin: **pauta de renders** (checklist: llegada atardecer, terraza,
estar, cocina, dormitorio, nocturna).

**Órdenes** — email, casa, monto, add-on ajustes (bool + descripción del cliente),
estado (`pendiente`/`pagada`/`fallida`), `mpPreferenceId`, `mpPaymentId`,
`tokenDescarga` (único, sin caducidad), timestamps.

**Medios** — imágenes (variantes WebP generadas), archivos.
**Usuarios** — admin(s) del panel.

El editor de recintos es un **campo custom de Payload**: se dibuja el polígono de
cada recinto sobre la imagen de la planta y se le asigna render + frase.

## 7. Flujo de compra

1. Hoja de compra (bottom sheet): resumen + toggle "Ajustes menores (+$X)" con
   textarea + email → crea Orden `pendiente` + preference MP → redirect.
2. Webhook MP: valida firma → si `approved`, marca `pagada`, genera token, envía
   correo con `/descarga/[token]`, notifica admin si hay ajustes. Idempotente.
3. `/gracias` hace polling suave del estado de la orden (el webhook puede llegar
   antes o después del redirect) y muestra las descargas.
4. `/descarga/[token]`: lista los archivos y pide enlaces firmados al momento.
   Reutilizable para siempre; si el token no existe → página amable con contacto.
5. Pago rechazado/cancelado → `/gracias` muestra reintento (nueva preference).

Fuera de alcance v1: boleta/factura SII (manual), cuentas de usuario, cupones.

## 8. Pipeline de assets (script local `preparar-casa`)

Script Node ejecutado por el admin (o Claude) por casa:
1. `.dae` de Archicad → **GLB** comprimido (Draco + texturas reducidas, objetivo
   2–4 MB) — vía **Blender CLI portable** (descarga única, import Collada +
   export glTF) y `@gltf-transform/cli` para Draco y compresión de texturas.
2. Renders JPG → WebP responsivas.
3. Arma el ZIP del paquete (PDF + DWG + EETT) desde `F:\03 - Casas\NNN…`.
4. Sube todo vía API de Payload (o deja carpeta lista para subir por el admin).

Pendientes de contenido (usuario): exportar `.dae` de **003 María Pinto** y
**007 Yungay**; completar EETT faltantes; precios reales por casa; número de
WhatsApp; textos "quiénes somos" y testimonios; cuenta Mercado Pago production.

## 9. Errores, rendimiento y accesibilidad

- Webhook duplicado → no-op; pago sin orden → log + alerta admin.
- GLB falla al cargar → mensaje amable + se mantiene el diagrama de sol.
- Imágenes lazy + `next/image`; GLB y three.js solo bajo demanda; objetivo LCP
  < 2.5 s en 4G con el render de portada optimizado.
- `prefers-reduced-motion`: desactiva Ken Burns/parallax; el cielo cambia por
  pasos. Foco visible; el plano interactivo es navegable por teclado (recintos
  como botones) y los textos alternativos describen cada render.

## 10. Testing

- **Unit:** posición solar (suncalc wrapper), cálculo de precios (oferta+add-on),
  generación/validez de tokens.
- **Integración:** webhook MP en sandbox (aprobado, rechazado, duplicado),
  generación de enlaces firmados R2.
- **E2E (Playwright):** flujo completo de compra en sandbox MP + descarga; la
  página de casa renderiza sus momentos con y sin maqueta/obra.

## 11. Fases de implementación

1. **M1 — Base:** Next.js + Payload + Neon + R2 en Vercel; colecciones; carga de
   Casa Pitrufquén completa vía pipeline.
2. **M2 — La experiencia:** página de casa "Un día en la casa" completa (cielo,
   hilo, visita, planta, maqueta+sol, prueba, decide) mobile-first.
3. **M3 — Compra:** hoja de compra, Mercado Pago, webhook, `/gracias`,
   `/descarga/[token]`, correos.
4. **M4 — Sitio completo:** home + catálogo + legales + SEO + analítica; carga de
   las 7 casas; QA + deploy production con dominio.
