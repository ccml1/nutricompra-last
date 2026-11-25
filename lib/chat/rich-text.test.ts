import { describe, expect, it } from 'vitest'
import { parseInline, parseRichText } from './rich-text'

describe('parseRichText', () => {
  it('convierte títulos, negritas y listas del modelo en bloques', () => {
    const blocks = parseRichText('**Almuerzo (para 3)**\n- **Arroz** con frijoles\n- Huevo\n\n1. Lava\n2. Cocina\nTotal: S/ 9')

    expect(blocks.map((block) => block.kind)).toEqual(['paragraph', 'list', 'list', 'paragraph'])
    expect(blocks[0]).toEqual({ kind: 'paragraph', content: [{ text: 'Almuerzo (para 3)', bold: true }] })
    expect(blocks[1]).toMatchObject({ ordered: false, items: [[{ text: 'Arroz', bold: true }, { text: ' con frijoles', bold: false }], [{ text: 'Huevo', bold: false }]] })
    expect(blocks[2]).toMatchObject({ ordered: true })
  })

  it('un ** sin cerrar mientras el modelo escribe no se muestra', () => {
    expect(parseInline('Con S/ 15 **puedes')).toEqual([{ text: 'Con S/ 15 puedes', bold: false }])
  })
})
