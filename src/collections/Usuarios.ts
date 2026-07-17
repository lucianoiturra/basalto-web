import type { CollectionConfig } from 'payload'

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  labels: {
    singular: 'Usuario',
    plural: 'Usuarios',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [],
}
