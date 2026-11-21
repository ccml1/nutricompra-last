import table from './food-table.json'
import type { TpcaNutrients } from './nutrition'

/**
 * Un alimento del catálogo TPCA tal como lo usa la foto del plato:
 * - `label`: cómo lo nombra CLIP en inglés; null si no se distingue en una foto (aceite, azúcar…).
 * - `portionG`: porción habitual servida, en gramos (la persona la corrige).
 * - `cookedYield`: peso cocido / peso crudo. La tabla TPCA da muchos valores en crudo
 *   (arroz 358 kcal por 100 g crudo); 150 g de arroz cocido equivalen a 150 / 2.8 g crudo.
 *   Factores aproximados de rendimiento de cocción; 1 = se come como figura en la tabla.
 * - `nutrients`: valores TPCA por 100 g, copiados del catálogo (GET /foods). Viajan con la
 *   página para que el cálculo funcione aunque el backend no responda.
 */
export interface PlateFood {
  name: string
  label: string | null
  portionG: number
  cookedYield: number
  nutrients: TpcaNutrients
}

export const plateFoods: PlateFood[] = table

export const plateFoodByName = new Map(plateFoods.map((food) => [food.name, food]))

/** Valores TPCA por 100 g de cada alimento, por nombre. */
export const plateNutrientsByName = new Map(plateFoods.map((food) => [food.name, food.nutrients]))
