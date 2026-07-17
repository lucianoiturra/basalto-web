import type { CollectionConfig } from 'payload'

export const Paquetes: CollectionConfig = {
  slug: 'paquetes',
  labels: {
    singular: 'Paquete',
    plural: 'Paquetes',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'filename',
  },
  upload: {
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
  },
  fields: [
    {
      name: 'nota',
      label: 'Nota interna',
      type: 'text',
    },
  ],
}
