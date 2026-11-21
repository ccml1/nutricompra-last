import { describe, expect, it } from 'vitest'
import { suggestFoods } from './suggest'

/** Vectores de juguete de 3 dimensiones, ya normalizados como los de CLIP. */
const foods = [
  { name: 'Arroz blanco', embedding: [1, 0, 0] },
  { name: 'Pollo', embedding: [0, 1, 0] },
  { name: 'Tomate', embedding: [0, 0, 1] },
  { name: 'Lentejas', embedding: [0.99, 0.141, 0] },
]

describe('suggestFoods', () => {
  it('ordena los alimentos por parecido con la foto y deja los que tienen al menos 5 % (escala 100 de CLIP)', () => {
    // La foto se parece casi igual a lentejas (0.999) y arroz (0.995); poco al pollo y nada al tomate.
    // Con la escala 100 de CLIP: lentejas ≈ 60 %, arroz ≈ 40 %, pollo ≈ 0 %.
    const photo = [0.995, 0.0998, 0]

    const suggestions = suggestFoods(photo, foods)

    expect(suggestions.map((food) => food.name)).toEqual(['Lentejas', 'Arroz blanco'])
    expect(suggestions[0].probability).toBeGreaterThan(suggestions[1].probability)
  })

  it('siempre propone al menos el más parecido y nunca más de 5', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ name: `Alimento ${i}`, embedding: [1, 0, 0] }))

    expect(suggestFoods([0, 0, 1], foods)).toHaveLength(1)
    expect(suggestFoods([1, 0, 0], many)).toHaveLength(5)
  })
})
