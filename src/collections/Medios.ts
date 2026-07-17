import type { CollectionConfig } from 'payload'

export const Medios: CollectionConfig = {
  slug: 'medios',
  labels: {
    singular: 'Medio',
    plural: 'Medios',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'filename',
  },
  upload: {
    mimeTypes: ['image/*', 'model/gltf-binary'],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    imageSizes: [
      {
        name: 'tarjeta',
        width: 800,
        formatOptions: {
          format: 'webp',
          options: { quality: 80 },
        },
      },
      {
        name: 'pantalla',
        width: 1600,
        formatOptions: {
          format: 'webp',
          options: { quality: 82 },
        },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
    },
  ],
}
