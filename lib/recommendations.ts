import type { Recommendation, WeekPlan } from '@/types'
import { summarizePlanBudget } from './budget'
import { macroDistribution, weekNutritionAverage } from './nutrition'

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
