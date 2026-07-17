# Pipeline de assets de Basalto

Los scripts leen los originales sin modificarlos y escriben sus resultados en la
carpeta desde la que se ejecutan. Requieren Node.js 20 o posterior.

## 1. ZIP del paquete

Agrupa los PDF, DWG y EETT de una casa en carpetas separadas dentro de un ZIP:

```powershell
node scripts/preparar-zip.mjs "F:\03 - Casas\001 Casa Pitrufquen 180m2" pitrufquen-paquete.zip
```

Antes de subirlo, abre el ZIP y verifica que contenga `PDF/`, `DWG/` y, cuando
existan archivos, `EETT/`.

## 2. Renders WebP

Convierte uno o más JPG/PNG a WebP de calidad 82, respeta la orientación EXIF y
limita el ancho a 2400 px sin agrandar imágenes pequeñas:

```powershell
node scripts/preparar-webp.mjs `
  "F:\03 - Casas\001 Casa Pitrufquen 180m2\04 - Vistas\Catalgo adicional (1).jpg" `
  "F:\03 - Casas\001 Casa Pitrufquen 180m2\04 - Vistas\Catalgo adicional (4).jpg" `
  --out webp-out
```

## 3. Maqueta GLB

Blender se instala fuera de OneDrive, por ejemplo en
`C:\Herramientas\blender\`. Luego:

```powershell
& "C:\Herramientas\blender\blender.exe" --background `
  --python scripts/exportar-glb.py -- `
  "F:\03 - Casas\001 Casa Pitrufquen 180m2\06 - Modelo 3D\CASA PITRUFQUEN MEDITERRANEA.dae" `
  "pitrufquen.glb"

npx @gltf-transform/cli optimize pitrufquen.glb pitrufquen-optimizado.glb `
  --compress draco --texture-compress webp

npx @gltf-transform/cli inspect pitrufquen-optimizado.glb
```

Conserva el GLB original hasta verificar el optimizado. El objetivo es un archivo
final de 5 MB o menos, con mallas Draco y texturas WebP.

Las casas 003 y 007 todavía no tienen `.dae`: expórtalas desde Archicad antes de
ejecutar este paso.

## 4. Cargar Pitrufquén en Payload

Con Postgres disponible y las variables de `.env` configuradas:

```powershell
npm run seed:pitrufquen
```

El comando es idempotente: reutiliza medios existentes y actualiza la Casa 001
si ya fue creada. Antes debe existir `pitrufquen-paquete.zip`,
`pitrufquen.glb` y la carpeta `webp-out/` generada en los pasos anteriores.
