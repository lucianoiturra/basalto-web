import { existsSync, mkdirSync, statSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

import sharp from 'sharp'

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outArg = outIndex >= 0 ? args[outIndex + 1] : 'webp-out'
const entradas = outIndex >= 0 ? args.slice(0, outIndex) : args

if (!entradas.length || !outArg) {
  console.error(
    'Uso: node scripts/preparar-webp.mjs <imagen...> --out <directorio>',
  )
  process.exit(1)
}

const out = resolve(outArg)
mkdirSync(out, { recursive: true })

for (const entradaArg of entradas) {
  const entrada = resolve(entradaArg)

  if (!existsSync(entrada) || !statSync(entrada).isFile()) {
    console.error(`La imagen no existe: ${entrada}`)
    process.exitCode = 1
    continue
  }

  const destino = join(out, `${basename(entrada, extname(entrada))}.webp`)

  await sharp(entrada)
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destino)

  console.log(`OK → ${destino}`)
}
