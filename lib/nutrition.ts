import type { DayPlan, Meal, Nutrition, WeekPlan } from '@/types'

const emptyNutrition: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fats: a.fats + b.fats,
    fiber: a.fiber + b.fiber,
  }
}

export function sumMealNutrition(meals: Meal[]): Nutrition {
  return meals.reduce((acc, m) => addNutrition(acc, m.nutrition), emptyNutrition)
}

export function dayNutrition(day: DayPlan): Nutrition {
  return sumMealNutrition([day.desayuno, day.almuerzo, day.cena])
}

export function weekNutritionAverage(plan: WeekPlan): Nutrition {
  const total = plan.days.reduce(
    (acc, day) => addNutrition(acc, dayNutrition(day)),
    emptyNutrition,
  )
  const n = plan.days.length || 1
  return {
    calories: total.calories / n,
    protein: total.protein / n,
    carbs: total.carbs / n,
    fats: total.fats / n,
    fiber: total.fiber / n,
  }
}

/** Distribución de macronutrientes en porcentaje de calorías. */
export function macroDistribution(nutrition: Nutrition) {
  const proteinCals = nutrition.protein * 4
  const carbsCals = nutrition.carbs * 4
  const fatsCals = nutrition.fats * 9
  const totalCals = proteinCals + carbsCals + fatsCals || 1
  return {
    protein: (proteinCals / totalCals) * 100,
    carbs: (carbsCals / totalCals) * 100,
    fats: (fatsCals / totalCals) * 100,
  }
}

export const healthScoreLabels = {
  alto: 'Muy saludable',
  medio: 'Saludable',
  bajo: 'A mejorar',
} as const
