import type { CollectionConfig } from 'payload'

import { validarPoligono } from '../lib/poligono'
import { generarSlug } from '../lib/slug'

export const Casas: CollectionConfig = {
  slug: 'casas',
  labels: {
    singular: 'Casa',
    plural: 'Casas',
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['numero', 'nombre', 'publicada', 'precio'],
    description:
      'Completa la pauta de renders: llegada al atardecer, terraza, estar, cocina, dormitorio y nocturna.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'numero',
      label: 'Número (ej: 001)',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
      hooks: {
        beforeValidate: [
          ({ data, value }) => generarSlug(data?.nombre ?? String(value ?? '')),
        ],
      },
    },
    {
      name: 'ubicacion',
      label: 'Ubicación (ej: La Araucanía)',
      type: 'text',
    },
    {
      name: 'publicada',
      label: 'Publicada en la web',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'specs',
      label: 'Datos de la casa',
      type: 'group',
      fields: [
        {
          name: 'superficie',
          label: 'Superficie (m²)',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'pisos',
          label: 'Pisos',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'dormitorios',
          label: 'Dormitorios',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'banos',
          label: 'Baños',
          type: 'number',
          required: true,
          min: 1,
        },
      ],
    },
    {
      name: 'precio',
      label: 'Precio (CLP)',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'precioOferta',
      label: 'Precio oferta (CLP, opcional)',
      type: 'number',
      min: 0,
    },
    {
      name: 'precioAjustes',
      label: 'Precio de ajustes menores (CLP)',
      type: 'number',
      defaultValue: 150000,
      min: 0,
    },
    {
      name: 'coordenadas',
      label: 'Ubicación para calcular el sol',
      type: 'group',
      fields: [
        {
          name: 'lat',
          label: 'Latitud',
          type: 'number',
          defaultValue: -38.98,
          min: -90,
          max: 90,
        },
        {
          name: 'lng',
          label: 'Longitud',
          type: 'number',
          defaultValue: -72.65,
          min: -180,
          max: 180,
        },
      ],
    },
    {
      name: 'momentos',
      label: 'La experiencia: Un día en la casa',
      type: 'group',
      fields: [
        {
          name: 'llegada',
          label: '16:00 · Llegas',
          type: 'group',
          fields: [
            {
              name: 'imagen',
              label: 'Imagen de llegada',
              type: 'upload',
              relationTo: 'medios',
            },
            {
              name: 'relato',
              label: 'Relato de llegada',
              type: 'textarea',
            },
          ],
        },
        {
          name: 'visita',
          label: '17:00 · La caminas (escenas)',
          type: 'array',
          labels: {
            singular: 'Escena',
            plural: 'Escenas',
          },
          fields: [
            {
              name: 'imagen',
              label: 'Imagen',
              type: 'upload',
              relationTo: 'medios',
              required: true,
            },
            {
              name: 'titulo',
              label: 'Título de la escena',
              type: 'text',
              required: true,
            },
            {
              name: 'frase',
              label: 'Frase (1–2 líneas)',
              type: 'textarea',
              required: true,
            },
            {
              name: 'puntoX',
              label: 'Punto en minimapa X (0–100)',
              type: 'number',
              required: true,
              min: 0,
              max: 100,
            },
            {
              name: 'puntoY',
              label: 'Punto en minimapa Y (0–100)',
              type: 'number',
              required: true,
              min: 0,
              max: 100,
            },
          ],
        },
        {
          name: 'plano',
          label: '18:30 · Lees el plano',
          type: 'group',
          fields: [
            {
              name: 'muros',
              label: 'Muros (segmentos en JSON)',
              type: 'json',
              admin: {
                description:
                  'Formato: [{"de":[x,y],"a":[x,y],"grosor":3}] en metros desde la esquina superior izquierda.',
              },
            },
            {
              name: 'recintos',
              label: 'Recintos',
              type: 'array',
              labels: {
                singular: 'Recinto',
                plural: 'Recintos',
              },
              fields: [
                {
                  name: 'nombre',
                  label: 'Nombre',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'superficie',
                  label: 'Superficie (m²)',
                  type: 'number',
                  required: true,
                  min: 0,
                },
                {
                  name: 'poligono',
                  label: 'Polígono (JSON [[x,y],…] en metros)',
                  type: 'json',
                  required: true,
                  validate: validarPoligono,
                },
                {
                  name: 'render',
                  label: 'Render del recinto',
                  type: 'upload',
                  relationTo: 'medios',
                },
                {
                  name: 'frase',
                  label: 'Frase',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
        {
          name: 'maqueta',
          label: '19:30 · El sol se pone (maqueta 3D)',
          type: 'group',
          fields: [
            {
              name: 'glb',
              label: 'Modelo GLB',
              type: 'upload',
              relationTo: 'medios',
            },
          ],
        },
        {
          name: 'fotosObra',
          label: '21:00 · La verdad (obra real)',
          type: 'array',
          labels: {
            singular: 'Foto de obra',
            plural: 'Fotos de obra',
          },
          fields: [
            {
              name: 'imagen',
              label: 'Imagen',
              type: 'upload',
              relationTo: 'medios',
              required: true,
            },
            {
              name: 'lugar',
              label: 'Lugar',
              type: 'text',
            },
            {
              name: 'fecha',
              label: 'Fecha',
              type: 'text',
              admin: { description: 'Ejemplo: 13.02.2023' },
            },
          ],
        },
      ],
    },
    {
      name: 'materiales',
      label: 'Materiales',
      type: 'array',
      labels: {
        singular: 'Material',
        plural: 'Materiales',
      },
      fields: [
        {
          name: 'nombre',
          label: 'Nombre',
          type: 'text',
          required: true,
        },
        {
          name: 'frase',
          label: 'Explicación simple',
          type: 'textarea',
          required: true,
        },
        {
          name: 'imagen',
          label: 'Imagen',
          type: 'upload',
          relationTo: 'medios',
        },
      ],
    },
    {
      name: 'paquete',
      label: 'El paquete descargable',
      type: 'group',
      fields: [
        {
          name: 'zip',
          label: 'ZIP del paquete',
          type: 'upload',
          relationTo: 'paquetes',
        },
        {
          name: 'laminas',
          label: 'Número de láminas PDF',
          type: 'number',
          min: 0,
        },
        {
          name: 'incluyeDwg',
          label: 'Incluye DWG',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'incluyeEett',
          label: 'Incluye EETT',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'faq',
      label: 'Preguntas frecuentes',
      type: 'array',
      labels: {
        singular: 'Pregunta',
        plural: 'Preguntas',
      },
      fields: [
        {
          name: 'pregunta',
          label: 'Pregunta',
          type: 'text',
          required: true,
        },
        {
          name: 'respuesta',
          label: 'Respuesta',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
