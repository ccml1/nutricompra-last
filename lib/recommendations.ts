import type { Meal, MealType, Recommendation, WeekPlan } from '@/types'
import { mockMeals } from '@/data/mock-meals'
import { summarizePlanBudget } from './budget'
import { macroDistribution, weekNutritionAverage } from './nutrition'

export function getMealReplacementCandidates(current: Meal, plan: WeekPlan): Meal[] {
  const planMealIds = new Set(plan.days.flatMap((day) => [day.desayuno.id, day.almuerzo.id, day.cena.id]))

  return mockMeals
    .filter((meal) => meal.type === current.type && meal.id !== current.id)
    .sort((a, b) => {
      const healthScore = { alto: 0, medio: 1, bajo: 2 } as const
      const availability = Number(planMealIds.has(a.id)) - Number(planMealIds.has(b.id))
      return availability || healthScore[a.healthScore] - healthScore[b.healthScore] || a.estimatedCost - b.estimatedCost
    })
}

export function findMealSlot(plan: WeekPlan, mealId: string, day?: string, mealType?: MealType) {
  if (day && mealType) {
    const selectedDay = plan.days.find((item) => item.day === day)
    if (selectedDay?.[mealType].id === mealId) return { day: selectedDay.day, mealType }
  }

  const match = plan.days.find((item) => [item.desayuno, item.almuerzo, item.cena].some((meal) => meal.id === mealId))
  if (!match) return null
  const type = (['desayuno', 'almuerzo', 'cena'] as const).find((key) => match[key].id === mealId)
  return type ? { day: match.day, mealType: type } : null
}

/**
 * Genera recomendaciones a partir de reglas simples sobre el plan. En una
 * versión futura, esta lógica puede ser reemplazada por un servicio de IA
 * (ver `services/ai`). La firma se mantiene estable para facilitar el cambio.
 */
export function generateRecommendations(plan: WeekPlan): Recommendation[] {
  const recommendations: Recommendation[] = []
  const budget = summarizePlanBudget(plan)
  const avg = weekNutritionAverage(plan)
  const macros = macroDistribution(avg)

  if (budget.savings > 0) {
    recommendations.push({
      id: 'rec-ahorro',
      type: 'ahorro',
      title: 'Ahorra comprando en el mercado',
      message: `Comparando precios entre establecimientos podrías ahorrar alrededor de S/ ${budget.savings.toFixed(
        2,
      )} esta semana. El mercado suele tener los mejores precios en frutas y verduras.`,
      savings: budget.savings,
      actionLabel: 'Ver comparador de precios',
      actionHref: '/precios',
    })
  }

  if (budget.level === 'excedido') {
    recommendations.push({
      id: 'rec-presupuesto',
      type: 'presupuesto',
      title: 'Tu plan supera el presupuesto',
      message:
        'Considera reemplazar la carne de res por pollo o legumbres en uno o dos almuerzos para reducir el costo sin perder proteína.',
      actionLabel: 'Ajustar menú',
      actionHref: '/menu',
    })
  } else if (budget.level === 'ok') {
    recommendations.push({
      id: 'rec-presupuesto-ok',
      type: 'presupuesto',
      title: 'Vas muy bien con tu presupuesto',
      message: `Tu plan usa el ${Math.round(
        budget.usedPercent,
      )}% del presupuesto semanal. Te queda margen para incluir una fruta extra al día.`,
      actionHref: '/menu',
      actionLabel: 'Ver menú',
    })
  }

  if (avg.fiber < 25) {
    recommendations.push({
      id: 'rec-fibra',
      type: 'nutricion',
      title: 'Suma más fibra a tu semana',
      message:
        'Incorpora legumbres como lentejas o frijoles, y más verduras de hoja verde para acercarte a los 25 g de fibra diarios recomendados.',
      actionLabel: 'Ver alimentos',
      actionHref: '/menu',
    })
  }

  if (macros.protein < 15) {
    recommendations.push({
      id: 'rec-proteina',
      type: 'nutricion',
      title: 'Refuerza la proteína',
      message:
        'Los niños del hogar necesitan proteína para crecer. Añade huevo en el desayuno o atún y pollo en los almuerzos.',
    })
  }

  recommendations.push({
    id: 'rec-variedad',
    type: 'variedad',
    title: 'Varía las frutas de temporada',
    message:
      'Aprovecha las frutas de temporada como papaya y plátano: suelen ser más económicas y aportan variedad de vitaminas.',
  })

  return recommendations
}
