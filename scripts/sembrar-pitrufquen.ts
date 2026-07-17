import 'dotenv/config'

import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const raiz = process.cwd()
const assets = {
  llegada: path.join(raiz, 'webp-out', 'Catalgo adicional (1).webp'),
  terraza: path.join(raiz, 'webp-out', 'Catalgo adicional (4).webp'),
  comedor: path.join(raiz, 'webp-out', 'Catalgo adicional (2).webp'),
  dormitorio: path.join(raiz, 'webp-out', 'Catalgo adicional (3).webp'),
  obra: path.join(raiz, 'webp-out', '_LUC4400.webp'),
  maqueta: path.join(raiz, 'pitrufquen.glb'),
  paquete: path.join(raiz, 'pitrufquen-paquete.zip'),
}

const escala = 18 / 378
const redondear = (valor: number) => Number(valor.toFixed(3))
const punto = (x: number, y: number) => [
  redondear((x - 8) * escala),
  redondear((y - 8) * escala),
]
const rectangulo = (x: number, y: number, ancho: number, alto: number) => [
  punto(x, y),
  punto(x + ancho, y),
  punto(x + ancho, y + alto),
  punto(x, y + alto),
]

async function main() {
  const payload = await getPayload({ config })

  const medio = async (
    filePath: string,
    alt: string,
  ): Promise<number> => {
    const filename = path.basename(filePath)
    const existente = await payload.find({
      collection: 'medios',
      limit: 1,
      where: { filename: { equals: filename } },
    })

    if (existente.docs[0]) return existente.docs[0].id

    const creado = await payload.create({
      collection: 'medios',
      data: { alt },
      filePath,
    })

    return creado.id
  }

  const paquete = async (): Promise<number> => {
    const filename = path.basename(assets.paquete)
    const existente = await payload.find({
      collection: 'paquetes',
      limit: 1,
      where: { filename: { equals: filename } },
    })

    if (existente.docs[0]) return existente.docs[0].id

    const creado = await payload.create({
      collection: 'paquetes',
      data: {
        nota: 'Paquete completo Casa 001 · Pitrufquén',
      },
      filePath: assets.paquete,
    })

    return creado.id
  }

  const [
    llegada,
    terraza,
    comedor,
    dormitorio,
    obra,
    maqueta,
    zip,
  ] = await Promise.all([
    medio(assets.llegada, 'Casa Pitrufquén al caer la tarde'),
    medio(assets.terraza, 'Terraza cubierta de la Casa Pitrufquén'),
    medio(assets.comedor, 'Comedor y cocina integrados de la Casa Pitrufquén'),
    medio(assets.dormitorio, 'Dormitorio con luz de mañana'),
    medio(assets.obra, 'Casa Pitrufquén construida en La Araucanía'),
    medio(assets.maqueta, 'Maqueta tridimensional de la Casa Pitrufquén'),
    paquete(),
  ])

  const muros = [
    { de: punto(8, 8), a: punto(332, 8), grosor: 0.14 },
    { de: punto(332, 8), a: punto(332, 131), grosor: 0.14 },
    { de: punto(332, 131), a: punto(8, 131), grosor: 0.14 },
    { de: punto(8, 131), a: punto(8, 8), grosor: 0.14 },
    { de: punto(8, 65), a: punto(332, 65), grosor: 0.08 },
    { de: punto(152, 82), a: punto(332, 82), grosor: 0.08 },
    { de: punto(86, 8), a: punto(86, 65), grosor: 0.08 },
    { de: punto(116, 8), a: punto(116, 65), grosor: 0.08 },
    { de: punto(152, 8), a: punto(152, 82), grosor: 0.08 },
    { de: punto(221, 8), a: punto(221, 65), grosor: 0.08 },
    { de: punto(296, 8), a: punto(296, 65), grosor: 0.08 },
    { de: punto(116, 65), a: punto(116, 131), grosor: 0.08 },
    { de: punto(221, 82), a: punto(221, 131), grosor: 0.08 },
  ]

  const recintos = [
    {
      nombre: 'COCINA',
      superficie: 14.27,
      poligono: rectangulo(8, 8, 78, 57),
      render: comedor,
      frase: 'Abierta al comedor, con isla para cocinar mirando a la familia.',
    },
    {
      nombre: 'LAVANDERÍA',
      superficie: 5.32,
      poligono: rectangulo(86, 8, 30, 57),
      frase: 'Lavado y secado en su propio cuarto: el ruido queda tras la puerta.',
    },
    {
      nombre: 'BAÑO 1',
      superficie: 6.45,
      poligono: rectangulo(116, 8, 36, 57),
      frase: 'Con tina, para el ala de los niños.',
    },
    {
      nombre: 'HABITACIÓN 3',
      superficie: 12.42,
      poligono: rectangulo(152, 8, 69, 57),
      render: dormitorio,
      frase: 'Sol de mañana por el oriente.',
    },
    {
      nombre: 'HABITACIÓN 2',
      superficie: 13.55,
      poligono: rectangulo(221, 8, 75, 57),
      render: dormitorio,
      frase: 'Sol de mañana y vista al jardín.',
    },
    {
      nombre: 'BAÑO 2',
      superficie: 6.53,
      poligono: rectangulo(296, 8, 36, 57),
      frase: 'El baño de visitas y del dormitorio principal.',
    },
    {
      nombre: 'COMEDOR',
      superficie: 22.92,
      poligono: rectangulo(8, 65, 108, 66),
      render: comedor,
      frase: 'La mesa larga junto al ventanal poniente: aquí pasan las sobremesas.',
    },
    {
      nombre: 'LIVING',
      superficie: 22.08,
      poligono: rectangulo(116, 65, 105, 66),
      frase: 'Estar amplio conectado al comedor y al deck.',
    },
    {
      nombre: 'CIRCULACIÓN',
      superficie: 5.84,
      poligono: rectangulo(152, 65, 180, 17),
      frase: 'Un solo pasillo corto reparte a los dormitorios.',
    },
    {
      nombre: 'HABITACIÓN 1',
      superficie: 17.59,
      poligono: rectangulo(221, 82, 111, 49),
      render: dormitorio,
      frase: 'El dormitorio principal, con salida directa a la terraza.',
    },
    {
      nombre: 'TERRAZA',
      superficie: 52.72,
      poligono: [
        punto(332, 8),
        punto(386, 8),
        punto(386, 159),
        punto(8, 159),
        punto(8, 131),
        punto(332, 131),
      ],
      render: terraza,
      frase: 'En L: quincho techado al oriente y deck abierto al poniente.',
    },
  ]

  const data = {
    nombre: 'Pitrufquén',
    numero: '001',
    ubicacion: 'La Araucanía',
    publicada: true,
    specs: {
      superficie: 180,
      pisos: 1,
      dormitorios: 4,
      banos: 2,
    },
    precio: 89900,
    precioOferta: 59900,
    precioAjustes: 150000,
    coordenadas: {
      lat: -38.98,
      lng: -72.65,
    },
    momentos: {
      llegada: {
        imagen: llegada,
        relato:
          'Es media tarde en La Araucanía y subes la loma. La casa aparece larga y baja, esperándote. Quédate hasta la noche: esta página dura lo que dura una visita de verdad.',
      },
      visita: [
        {
          imagen: terraza,
          titulo: 'Se llega por afuera',
          frase:
            'Quincho, leña y sombra mirando el valle. En el sur, la vida pasa aquí aunque llueva.',
          puntoX: 85,
          puntoY: 52,
        },
        {
          imagen: comedor,
          titulo: 'Un solo espacio',
          frase:
            'Integrados y abiertos al norte. La luz de la tarde entra hasta la mesa.',
          puntoX: 17,
          puntoY: 69,
        },
        {
          imagen: dormitorio,
          titulo: 'El ala del silencio',
          frase:
            'Cuatro dormitorios en su propia ala. Sol de mañana para despertar.',
          puntoX: 61,
          puntoY: 33,
        },
      ],
      plano: {
        muros,
        recintos,
      },
      maqueta: {
        glb: maqueta,
      },
      fotosObra: [
        {
          imagen: obra,
          lugar: 'Pitrufquén, La Araucanía',
          fecha: '13.02.2023',
        },
      ],
    },
    materiales: [
      {
        nombre: 'Revestimiento de fibrocemento',
        frase: 'No se pudre con la lluvia y no exige pintura cada año.',
      },
      {
        nombre: 'Estructura de pino impregnado',
        frase: 'Madera tratada contra humedad y termitas.',
      },
      {
        nombre: 'Cubierta de zinc alum',
        frase: 'Liviana, durable y sin mantención.',
      },
      {
        nombre: 'Ventanas de PVC termopanel',
        frase: 'Doble vidrio: guarda el calor y aísla el ruido.',
      },
    ],
    paquete: {
      zip,
      laminas: 13,
      incluyeDwg: true,
      incluyeEett: false,
    },
    faq: [
      {
        pregunta: '¿Qué recibo al comprar?',
        respuesta:
          'Recibes 13 láminas PDF y los archivos DWG editables en una descarga inmediata.',
      },
      {
        pregunta: '¿Puedo pedir cambios?',
        respuesta:
          'Sí. Puedes agregar ajustes menores al comprar y contarnos qué necesitas.',
      },
    ],
  }

  const existente = await payload.find({
    collection: 'casas',
    limit: 1,
    where: { numero: { equals: '001' } },
  })

  const casa = existente.docs[0]
    ? await payload.update({
        collection: 'casas',
        id: existente.docs[0].id,
        data,
      })
    : await payload.create({
        collection: 'casas',
        data,
      })

  console.log(
    JSON.stringify(
      {
        id: casa.id,
        slug: casa.slug,
        publicada: casa.publicada,
        escenas: casa.momentos?.visita?.length ?? 0,
        recintos: casa.momentos?.plano?.recintos?.length ?? 0,
      },
      null,
      2,
    ),
  )

  await Promise.race([
    payload.destroy(),
    new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  ])
  process.exit(0)
}

await main()
