/**
 * Lectura de la salida de Calorie Lens (shalev396/calorie-lens, MIT): pasa lo
 * que devuelve el modelo a ingredientes con sus gramos y nutrientes, y a los
 * totales del plato. Es la misma cuenta que `summarise` del script oficial
 * (addisonbk/calorie-lens-onnx, predict.py).
 */

/** Nutrientes que da el modelo, en este orden (igual que en su config). */
export const NUTRIENT_KEYS = ['kcal', 'fat_g', 'carb_g', 'protein_g', 'fiber_g', 'sugars_g', 'sat_fat_g', 'sodium_mg'] as const
export type NutrientKey = (typeof NUTRIENT_KEYS)[number]
export type Nutrients = Record<NutrientKey, number>

/** Lo que usamos de la config del modelo (public/models/calorie-lens/config.json). */
export interface PlateConfig {
  ingredients: string[]
  /** Por ingrediente, los 8 nutrientes por gramo. */
  densities: number[][]
  /** Nutrientes por gramo de lo que no se identifica. */
  mean_density: number[]
  presence_threshold: number
  display_min_grams: number
}

/** Salidas del modelo para una foto. */
export interface RawPlateOutputs {
  grams: ArrayLike<number>
  logits: ArrayLike<number>
  massGap: number
  logTotals: ArrayLike<number>
}

export interface PlateItem extends Nutrients {
  name: string
  grams: number
  /** Qué tan seguro está el modelo de que el ingrediente está en el plato (0 a 1). */
  confidence?: number
}

export interface PlateReadout {
  /** Hasta 12 ingredientes, de más a menos gramos. */
  ingredients: PlateItem[]
  /** Lo que el modelo no identifica con seguridad, junto. */
  other: PlateItem
  totals: Nutrients & { mass_g: number }
  /** Estimación directa del plato completo (sostiene mejor el peso en fotos poco parecidas). */
  directEstimate: { mass_g: number; kcal: number; fat_g: number; carb_g: number; protein_g: number }
}

/** Ingredientes que se muestran como máximo, como en el script oficial. */
const MAX_SHOWN = 12

/** Redondeo a `digits` decimales (como `round` de Python, salvo empates exactos). */
const round = (value: number, digits: number) => Number(value.toFixed(digits))

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value))

function item(name: string, grams: number, perGram: ArrayLike<number>, confidence?: number): PlateItem {
  const nutrients = Object.fromEntries(
    NUTRIENT_KEYS.map((key, i) => [key, round(grams * perGram[i], 2)]),
  ) as Nutrients
  return { name, grams: round(grams, 1), ...(confidence === undefined ? {} : { confidence }), ...nutrients }
}

/** Ingredientes, "otros" y totales a partir de la salida del modelo. */
export function readPlate(raw: RawPlateOutputs, config: PlateConfig): PlateReadout {
  const grams = Array.from(raw.grams)
  const probabilities = Array.from(raw.logits, sigmoid)
  if (grams.length !== config.ingredients.length || probabilities.length !== grams.length) {
    throw new Error('La salida del modelo no tiene un valor por ingrediente')
  }

  const shown = grams
    .map((_, k) => k)
    .sort((a, b) => grams[b] - grams[a])
    .filter((k) => probabilities[k] >= config.presence_threshold && grams[k] >= config.display_min_grams)
    .slice(0, MAX_SHOWN)
  const ingredients = shown.map((k) =>
    item(config.ingredients[k], grams[k], config.densities[k], round(probabilities[k], 3)),
  )

  // Lo demás, más la masa que el modelo no reparte entre ingredientes, va a "otros".
  const shownSet = new Set(shown)
  const rest = grams.map((_, k) => k).filter((k) => !shownSet.has(k))
  const otherMass = rest.reduce((sum, k) => sum + grams[k], 0) + raw.massGap
  const otherNutrients = NUTRIENT_KEYS.map(
    (_, i) => rest.reduce((sum, k) => sum + grams[k] * config.densities[k][i], 0) + raw.massGap * config.mean_density[i],
  )
  const other = item(
    'other (unidentified)',
    otherMass,
    otherNutrients.map((value) => (otherMass > 0 ? value / otherMass : 0)),
  )

  const totals = {
    mass_g: round(grams.reduce((sum, value) => sum + value, 0) + raw.massGap, 1),
    ...(Object.fromEntries(
      NUTRIENT_KEYS.map((key) => [key, round(ingredients.reduce((sum, i) => sum + i[key], 0) + other[key], 2)]),
    ) as Nutrients),
  }

  const direct = Array.from(raw.logTotals, (value) => Math.expm1(Math.max(value, 0)))
  return {
    ingredients,
    other,
    totals,
    directEstimate: {
      kcal: round(direct[0], 2),
      mass_g: round(direct[1], 1),
      fat_g: round(direct[2], 2),
      carb_g: round(direct[3], 2),
      protein_g: round(direct[4], 2),
    },
  }
}

/**
 * Con el peso real del plato (en una balanza de cocina), la escala del modelo
 * deja de ser una adivinanza: todo se multiplica por peso real / peso estimado.
 */
export function scaleToPlateWeight(plate: PlateReadout, plateGrams: number): PlateReadout {
  if (!(plateGrams > 0) || !(plate.totals.mass_g > 0)) return plate
  const factor = plateGrams / plate.totals.mass_g
  const scale = (entry: PlateItem): PlateItem => ({
    ...entry,
    grams: round(entry.grams * factor, 1),
    ...(Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, round(entry[key] * factor, 2)])) as Nutrients),
  })
  return {
    ...plate,
    ingredients: plate.ingredients.map(scale),
    other: scale(plate.other),
    totals: {
      mass_g: round(plateGrams, 1),
      ...(Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, round(plate.totals[key] * factor, 2)])) as Nutrients),
    },
  }
}
