/** Nutrientes por 100 g de la tabla TPCA (null = la tabla no da el dato). */
export interface TpcaNutrients {
  energyKcal: number | null
  proteinG: number | null
  carbohydrateG: number | null
  fatG: number | null
  fiberG: number | null
}

export interface PlateEntry {
  food: { name: string; nutrients: TpcaNutrients }
  /** Gramos tal como están en el plato (cocidos si se cocinan). */
  grams: number
  /** Peso cocido / peso crudo (ver PlateFood.cookedYield). */
  cookedYield: number
}

const KEYS = { kcal: 'energyKcal', proteinG: 'proteinG', carbsG: 'carbohydrateG', fatG: 'fatG', fiberG: 'fiberG' } as const
type Key = keyof typeof KEYS
export type PlateNutrients = Record<Key, number>

/**
 * Nutrientes del plato con la tabla peruana: cada alimento aporta
 * (gramos servidos / rendimiento de cocción) × valor por 100 g / 100.
 */
export function plateNutrition(entries: PlateEntry[]) {
  const missing = new Set<string>()
  const items = entries.map(({ food, grams, cookedYield }) => {
    const tableGrams = grams / (cookedYield > 0 ? cookedYield : 1)
    const values = Object.fromEntries(
      (Object.keys(KEYS) as Key[]).map((key) => {
        const per100 = food.nutrients[KEYS[key]]
        if (per100 === null && grams > 0) missing.add(KEYS[key])
        return [key, ((per100 ?? 0) * tableGrams) / 100]
      }),
    ) as PlateNutrients
    return { name: food.name, grams, ...values }
  })
  const totals = Object.fromEntries(
    (Object.keys(KEYS) as Key[]).map((key) => [key, items.reduce((sum, item) => sum + item[key], 0)]),
  ) as PlateNutrients
  return {
    items,
    totals: { grams: items.reduce((sum, item) => sum + item.grams, 0), ...totals },
    /** Nutrientes que la tabla no da para algún alimento del plato: su total puede quedar corto. */
    missing: [...missing],
  }
}
