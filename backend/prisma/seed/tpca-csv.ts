/**
 * Maps one row of data/nutricompra-foods-v1.csv (TPCA 2023 export) into the
 * three records the seed writes: Food, NutritionalProfile and DataSource.
 */

/** One CSV row as parsed with headers, every value still a raw string. */
export interface TpcaCsvRow {
  id: string;
  name: string;
  category: string;
  type: string;
  reference_amount: string;
  reference_unit: string;
  energy_kcal: string;
  protein_g: string;
  carbohydrate_g: string;
  fat_g: string;
  fiber_g: string;
  sodium_mg: string;
  calcium_mg: string;
  iron_mg: string;
  source: string;
  source_version: string;
  source_code: string;
  source_name: string;
}

export interface TpcaSeedRecord {
  food: { name: string; category: string; type: string };
  profile: {
    referenceAmount: number;
    referenceUnit: string;
    energyKcal: number | null;
    proteinG: number | null;
    carbohydrateG: number | null;
    fatG: number | null;
    fiberG: number | null;
    sodiumMg: number | null;
    calciumMg: number | null;
    ironMg: number | null;
  };
  source: {
    name: string;
    version: string;
    sourceCode: string;
    sourceName: string;
  };
}

/**
 * An empty cell means the source does not report that nutrient, so it maps
 * to null. Number('') would silently turn it into 0, a different fact.
 */
function toNutrient(value: string): number | null {
  return value === '' ? null : Number(value);
}

export function mapTpcaRow(row: TpcaCsvRow): TpcaSeedRecord {
  return {
    food: { name: row.name, category: row.category, type: row.type },
    profile: {
      referenceAmount: Number(row.reference_amount),
      referenceUnit: row.reference_unit,
      energyKcal: toNutrient(row.energy_kcal),
      proteinG: toNutrient(row.protein_g),
      carbohydrateG: toNutrient(row.carbohydrate_g),
      fatG: toNutrient(row.fat_g),
      fiberG: toNutrient(row.fiber_g),
      sodiumMg: toNutrient(row.sodium_mg),
      calciumMg: toNutrient(row.calcium_mg),
      ironMg: toNutrient(row.iron_mg),
    },
    source: {
      name: row.source,
      version: row.source_version,
      sourceCode: row.source_code,
      sourceName: row.source_name,
    },
  };
}
