import type { Nutrition } from './food'

export type MealType = 'desayuno' | 'almuerzo' | 'cena'

export type Weekday =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export type HealthScore = 'alto' | 'medio' | 'bajo'

export interface MealIngredient {
  foodId: string
  name: string
  /** Cantidad legible para la lista de compras, p. ej. "200 g". */
  quantity: string
  /** Costo estimado en soles para la porción de esta comida. */
  cost: number
}

export interface Meal {
  id: string
  name: string
  type: MealType
  description: string
  ingredients: MealIngredient[]
  estimatedCost: number
  nutrition: Nutrition
  healthScore: HealthScore
}

export interface DayPlan {
  day: Weekday
  desayuno: Meal
  almuerzo: Meal
  cena: Meal
}

export interface WeekPlan {
  id: string
  weekLabel: string
  budget: number
  days: DayPlan[]
  /**
   * Porciones que come el hogar en cada comida (adulto = 1, niño = 0.75). Los
   * costos y cantidades de las comidas son por persona; el plan los multiplica por esto.
   * Si falta, cuenta como 1.
   */
  portions?: number
  /**
   * Compras de la semana que no son de una comida (despensa básica, loncheras),
   * ya calculadas para todo el hogar.
   */
  extras?: MealIngredient[]
  /** Loncheras escolares de lunes a viernes, si en el hogar hay niños. */
  lunchboxes?: { day: Weekday; lunchbox: Lunchbox }[]
  /** Niños que llevan lonchera. */
  lunchboxChildren?: number
  /** true si el menú se ajustó para que alcance el presupuesto. */
  economy?: boolean
}

/** Una lonchera escolar: lo que lleva un niño al colegio. */
export interface Lunchbox {
  id: string
  name: string
  ingredients: MealIngredient[]
  /** Costo por niño. */
  cost: number
}
