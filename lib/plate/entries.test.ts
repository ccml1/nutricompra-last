import { describe, expect, it } from 'vitest'
import { entriesFromAnalysis, plateFromEntries } from './entries'

/** Valores TPCA reales por 100 g (arroz crudo). */
const catalog = new Map([
  ['Arroz blanco', { energyKcal: 358, proteinG: 7.8, carbohydrateG: 77.6, fatG: 0.7, fiberG: null }],
])

describe('entriesFromAnalysis', () => {
  it('convierte lo que vio el modelo en alimentos del plato con sus gramos', () => {
    const entries = entriesFromAnalysis({
      dish: 'Arroz con pan',
      foods: [
        { name: 'Arroz blanco', grams: 150, inCatalog: true },
        { name: 'Pan francés', grams: 40, inCatalog: false, per100g: { kcal: 270, proteinG: 9, carbsG: 52, fatG: 3 } },
      ],
    })

    expect(entries).toEqual([
      { name: 'Arroz blanco', grams: '150' },
      { name: 'Pan francés', grams: '40', per100g: { kcal: 270, proteinG: 9, carbsG: 52, fatG: 3 } },
    ])
  })
})

describe('plateFromEntries', () => {
  it('usa la TPCA con el rendimiento de cocción para lo del catálogo y el valor estimado por 100 g para lo demás', () => {
    // Arroz: 150 g cocidos / 2.8 → 192 kcal. Pan: 40 g × 270 / 100 = 108 kcal (se come como está).
    const plate = plateFromEntries(
      [
        { name: 'Arroz blanco', grams: '150' },
        { name: 'Pan francés', grams: '40', per100g: { kcal: 270, proteinG: 9, carbsG: 52, fatG: 3 } },
      ],
      catalog,
    )

    expect(plate.items.map((item) => Math.round(item.kcal))).toEqual([192, 108])
    expect(Math.round(plate.totals.kcal)).toBe(300)
    expect(plate.totals.grams).toBe(190)
  })
})
