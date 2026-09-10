export type FoodCategory =
  | 'cereales'
  | 'legumbres'
  | 'carnes'
  | 'frutas'
  | 'verduras'
  | 'lacteos'
  | 'otros'

export interface Nutrition {
  /** Valores aproximados por cada 100 g de alimento. */
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

export interface Food {
  id: string
  name: string
  category: FoodCategory
  /** Unidad de referencia para el precio, p. ej. "kg", "unidad", "L". */
  unit: string
  /** Precio de referencia aproximado en soles (S/) por unidad. */
  referencePrice: number
  nutrition: Nutrition
}
