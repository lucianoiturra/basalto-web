import type { CollectionConfig } from 'payload'

import { generarToken } from '../lib/token'

const soloAdmin = ({ req }: { req: { user: unknown } }) => Boolean(req.user)

export const Ordenes: CollectionConfig = {
  slug: 'ordenes',
  labels: {
    singular: 'Orden',
    plural: 'Órdenes',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'estado', 'monto', 'createdAt'],
  },
  access: {
    read: soloAdmin,
    create: () => true,
    update: soloAdmin,
    delete: soloAdmin,
  },
  fields: [
    {
      name: 'email',
      label: 'Correo del comprador',
      type: 'email',
      required: true,
    },
    {
      name: 'casa',
      label: 'Casa',
      type: 'relationship',
      relationTo: 'casas',
      required: true,
    },
    {
      name: 'monto',
      label: 'Monto (CLP)',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'conAjustes',
      label: 'Incluye ajustes menores',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'descripcionAjustes',
      label: 'Qué quiere ajustar',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.conAjustes),
      },
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      defaultValue: 'pendiente',
      required: true,
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Pagada', value: 'pagada' },
        { label: 'Fallida', value: 'fallida' },
      ],
    },
    {
      name: 'mpPreferenceId',
      label: 'Preferencia de Mercado Pago',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'mpPaymentId',
      label: 'Pago de Mercado Pago',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'tokenDescarga',
      label: 'Token de descarga',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
      hooks: {
        beforeValidate: [({ value }) => value ?? generarToken()],
      },
    },
  ],
}
