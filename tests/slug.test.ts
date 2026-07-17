import { describe, expect, it } from 'vitest'

import { generarSlug } from '../src/lib/slug'

describe('generarSlug', () => {
  it('convierte un nombre con tildes y espacios', () => {
    expect(generarSlug('Casa María Pinto')).toBe('casa-maria-pinto')
  })

  it('limpia caracteres especiales y la ñ', () => {
    expect(generarSlug('Ñuñoa  180m² (v2)')).toBe('nunoa-180m2-v2')
  })
})
