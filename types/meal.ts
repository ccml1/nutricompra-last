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
}
