import { plateFoodByName, plateNutrientsByName } from '@/lib/plate/foods'
import { plateNutrition, type TpcaNutrients } from '@/lib/plate/nutrition'
import type { EstimatedPer100g, PlateAnalysis } from '@/types'

/**
 * Un alimento del plato en pantalla: su nombre, los gramos (texto editable) y,
 * si no está en la tabla TPCA, el valor por 100 g que estimó el modelo.
 */
export interface PlateEntry {
  name: string
  grams: string
  per100g?: EstimatedPer100g
  /** Probabilidad, cuando el alimento lo propuso el reconocimiento básico (CLIP). */
  probability?: number
}

/** Lo que vio el modelo, como alimentos del plato. */
export function entriesFromAnalysis(analysis: PlateAnalysis): PlateEntry[] {
  return analysis.foods.map((food) => ({
    name: food.name,
    grams: String(food.grams),
    ...(food.inCatalog ? {} : { per100g: food.per100g }),
  }))
}

const toGrams = (text: string) => Math.max(0, Number(text.replace(',', '.')) || 0)

/**
 * Nutrientes del plato: lo del catálogo con la tabla TPCA y su rendimiento de
 * cocción; lo demás con el valor estimado por 100 g (tal como se sirve).
 */
export function plateFromEntries(entries: PlateEntry[], catalog: Map<string, TpcaNutrients> = plateNutrientsByName) {
  return plateNutrition(
    entries.flatMap((entry) => {
      const grams = toGrams(entry.grams)
      if (entry.per100g) {
        const { kcal, proteinG, carbsG, fatG } = entry.per100g
        const nutrients = { energyKcal: kcal, proteinG, carbohydrateG: carbsG, fatG, fiberG: null }
        return [{ food: { name: entry.name, nutrients }, grams, cookedYield: 1 }]
      }
      const nutrients = catalog.get(entry.name)
      if (!nutrients) return []
      return [{ food: { name: entry.name, nutrients }, grams, cookedYield: plateFoodByName.get(entry.name)?.cookedYield ?? 1 }]
    }),
  )
}
