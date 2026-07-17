import archiver from 'archiver'
import {
  createWriteStream,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'

const [origenArg, salidaArg] = process.argv.slice(2)

if (!origenArg || !salidaArg) {
  console.error('Uso: node scripts/preparar-zip.mjs "<carpeta casa>" <salida.zip>')
  process.exit(1)
}

const origen = resolve(origenArg)
const salida = resolve(salidaArg)

if (!existsSync(origen) || !statSync(origen).isDirectory()) {
  console.error(`La carpeta de origen no existe: ${origen}`)
  process.exit(1)
}

function buscarCarpeta(prefijo) {
  return readdirSync(origen).find((nombre) => {
    const ruta = join(origen, nombre)
    return statSync(ruta).isDirectory() && nombre.toLowerCase().startsWith(prefijo)
  })
}

function agregarArchivos(zip, directorio, destino, acepta) {
  for (const nombre of readdirSync(directorio)) {
    const ruta = join(directorio, nombre)
    const estado = statSync(ruta)

    if (estado.isDirectory()) {
      agregarArchivos(zip, ruta, `${destino}/${nombre}`, acepta)
    } else if (acepta(nombre)) {
      zip.file(ruta, { name: `${destino}/${nombre}` })
    }
  }
}

const carpetaPlanos = buscarCarpeta('01')
const carpetaEett = buscarCarpeta('03')

if (!carpetaPlanos) {
  console.error('No encontré la carpeta 01 - Planos')
  process.exit(1)
}

await new Promise((resolvePromise, rejectPromise) => {
  const archivo = createWriteStream(salida)
  const zip = archiver('zip', { zlib: { level: 9 } })

  archivo.on('close', resolvePromise)
  archivo.on('error', rejectPromise)
  zip.on('warning', (error) => {
    if (error.code === 'ENOENT') console.warn(error.message)
    else rejectPromise(error)
  })
  zip.on('error', rejectPromise)
  zip.pipe(archivo)

  const planos = join(origen, carpetaPlanos)
  agregarArchivos(zip, planos, 'PDF', (nombre) =>
    nombre.toLowerCase().endsWith('.pdf'),
  )
  agregarArchivos(zip, planos, 'DWG', (nombre) =>
    nombre.toLowerCase().endsWith('.dwg'),
  )

  if (carpetaEett) {
    const eett = join(origen, carpetaEett)
    if (existsSync(eett)) {
      agregarArchivos(zip, eett, 'EETT', () => true)
    }
  }

  zip.finalize()
})

console.log(`OK → ${basename(salida)}`)
