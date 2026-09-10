import type { ShoppingList, WeekPlan } from '@/types'

export type BudgetLevel = 'ok' | 'ajustado' | 'excedido'

export interface BudgetSummary {
  budget: number
  estimatedTotal: number
  optimizedTotal: number
  savings: number
  remaining: number
  usedPercent: number
  level: BudgetLevel
}

export function summarizeShoppingBudget(list: ShoppingList): BudgetSummary {
  const estimatedTotal = list.items.reduce((s, i) => s + i.estimatedPrice, 0)
  const optimizedTotal = list.items.reduce((s, i) => s + i.bestPrice, 0)
  return buildSummary(list.budget, estimatedTotal, optimizedTotal)
}

export function summarizePlanBudget(plan: WeekPlan): BudgetSummary {
  const estimatedTotal = plan.days.reduce(
    (sum, day) =>
      sum + day.desayuno.estimatedCost + day.almuerzo.estimatedCost + day.cena.estimatedCost,
    0,
  )
  // El plan asume el hogar completo; se aproxima el total optimizado en 12% menos.
  const optimizedTotal = estimatedTotal * 0.88
  return buildSummary(plan.budget, estimatedTotal, optimizedTotal)
}

function buildSummary(
  budget: number,
  estimatedTotal: number,
  optimizedTotal: number,
): BudgetSummary {
  const round = (n: number) => Math.round(n * 10) / 10
  const est = round(estimatedTotal)
  const opt = round(optimizedTotal)
  const usedPercent = budget > 0 ? (est / budget) * 100 : 0

  let level: BudgetLevel = 'ok'
  if (usedPercent > 100) level = 'excedido'
  else if (usedPercent >= 85) level = 'ajustado'

  return {
    budget,
    estimatedTotal: est,
    optimizedTotal: opt,
    savings: round(est - opt),
    remaining: round(budget - est),
    usedPercent,
    level,
  }
}

export const budgetLevelLabels: Record<BudgetLevel, string> = {
  ok: 'Dentro del presupuesto',
  ajustado: 'Presupuesto ajustado',
  excedido: 'Presupuesto excedido',
}
