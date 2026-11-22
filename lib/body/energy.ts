import type { Sex } from '@/types'

/** Cuánto se mueve la persona en el día: multiplica el gasto en reposo (Mifflin-St Jeor). */
export const activityLevels = {
  sedentary: { label: 'Sedentaria', hint: 'Poco o nada de ejercicio', factor: 1.2 },
  light: { label: 'Ligera', hint: 'Ejercicio 1 a 3 días por semana', factor: 1.375 },
  moderate: { label: 'Moderada', hint: 'Ejercicio 3 a 5 días por semana', factor: 1.55 },
  high: { label: 'Alta', hint: 'Ejercicio intenso 6 a 7 días por semana', factor: 1.725 },
} as const

export type ActivityLevel = keyof typeof activityLevels

/** Gasto en reposo (kcal/día) según Mifflin-St Jeor. */
export function restingKcal(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

/** IMC y su categoría según la OMS. */
export function bodyMassIndex(weightKg: number, heightCm: number) {
  const value = weightKg / (heightCm / 100) ** 2
  const label =
    value < 18.5 ? 'Bajo peso' : value < 25 ? 'Peso saludable' : value < 30 ? 'Sobrepeso' : 'Obesidad'
  return { value, label }
}

/**
 * Lo que necesita al día: calorías para mantener el peso (reposo × actividad) y
 * proteína de 0.8 a 1.2 g por kg (más alta si hace ejercicio).
 */
export function dailyNeeds(sex: Sex, weightKg: number, heightCm: number, age: number, activity: ActivityLevel) {
  return {
    kcal: restingKcal(sex, weightKg, heightCm, age) * activityLevels[activity].factor,
    proteinMinG: 0.8 * weightKg,
    proteinMaxG: 1.2 * weightKg,
  }
}

/** Qué parte de lo que necesita cubre el menú semanal (promedio por día y por persona), en %. */
export function menuCoverage(
  needs: { kcal: number; proteinMinG: number },
  menuPerDay: { calories: number; protein: number },
) {
  return {
    kcalPct: needs.kcal > 0 ? (menuPerDay.calories / needs.kcal) * 100 : 0,
    proteinPct: needs.proteinMinG > 0 ? (menuPerDay.protein / needs.proteinMinG) * 100 : 0,
  }
}
