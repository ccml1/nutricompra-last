import { describe, expect, it } from 'vitest'
import { plateNutrition } from './nutrition'

/** Valores TPCA reales por 100 g (arroz y pollo crudos, tomate fresco). */
const arroz = { name: 'Arroz blanco', nutrients: { energyKcal: 358, proteinG: 7.8, carbohydrateG: 77.6, fatG: 0.7, fiberG: null } }
const pollo = { name: 'Pollo', nutrients: { energyKcal: 119, proteinG: 21.4, carbohydrateG: 0, fatG: 3.1, fiberG: 0 } }
const tomate = { name: 'Tomate', nutrients: { energyKcal: 15, proteinG: 0.8, carbohydrateG: 3.4, fatG: 0.1, fiberG: 1.4 } }

describe('plateNutrition', () => {
  it('pasa los gramos cocidos a crudos con el rendimiento de cocción antes de usar la tabla TPCA', () => {
    // 150 g de arroz cocido / 2.8 = 53.6 g crudo → 358 × 0.536 = 192 kcal (no 537, como si fuera crudo).
    // 120 g de pollo cocido / 0.73 = 164.4 g crudo → 119 × 1.644 = 196 kcal. El tomate se come crudo: 60 g → 9 kcal.
    const plate = plateNutrition([
      { food: arroz, grams: 150, cookedYield: 2.8 },
      { food: pollo, grams: 120, cookedYield: 0.73 },
      { food: tomate, grams: 60, cookedYield: 1 },
    ])

    expect(plate.items.map((item) => Math.round(item.kcal))).toEqual([192, 196, 9])
    // El total suma sin redondear: 191.8 + 195.6 + 9.0 = 396.4.
    expect(Math.round(plate.totals.kcal)).toBe(396)
    expect(plate.totals.proteinG).toBeCloseTo(4.18 + 35.18 + 0.48, 1)
    expect(plate.totals.grams).toBe(330)
  })

  it('un nutriente sin dato en la tabla no suma, y el total lo avisa', () => {
    const plate = plateNutrition([{ food: arroz, grams: 150, cookedYield: 2.8 }])

    expect(plate.totals.fiberG).toBe(0)
    expect(plate.missing).toEqual(['fiberG'])
  })
})
