import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Casas } from './collections/Casas'
import { Medios } from './collections/Medios'
import { Ordenes } from './collections/Ordenes'
import { Paquetes } from './collections/Paquetes'
import { Usuarios } from './collections/Usuarios'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const storageConfig = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
}

function storagePlugins(): Plugin[] {
  const hasCredentials =
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_PUBLIC &&
    process.env.S3_BUCKET_PRIVATE

  if (!hasCredentials) return []

  return [
    s3Storage({
      collections: { medios: true },
      bucket: process.env.S3_BUCKET_PUBLIC!,
      config: storageConfig,
    }),
    s3Storage({
      collections: { paquetes: true },
      bucket: process.env.S3_BUCKET_PRIVATE!,
      config: storageConfig,
    }),
  ]
}

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    meta: {
      titleSuffix: '· Basalto',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [Usuarios, Medios, Paquetes, Casas, Ordenes],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        'postgresql://basalto:basalto_local@127.0.0.1:5432/basalto',
    },
  }),
  sharp,
  plugins: storagePlugins(),
})
