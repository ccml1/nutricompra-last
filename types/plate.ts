/** Valor estimado por 100 g para un alimento que no está en la tabla TPCA. */
export interface EstimatedPer100g {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

/** Lo que el modelo de visión vio en la foto (POST /plate/analyze). */
export interface PlateAnalysis {
  dish: string | null
  foods: { name: string; grams: number; inCatalog: boolean; per100g?: EstimatedPer100g }[]
}
