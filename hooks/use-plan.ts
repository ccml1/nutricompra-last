'use client'

import { useMemo } from 'react'
import { mockWeekPlan } from '@/data/mock-plan'
import { summarizePlanBudget, type BudgetSummary } from '@/lib/budget'
import { generateRecommendations } from '@/lib/recommendations'
import { buildShoppingList } from '@/lib/shopping'
import type { Recommendation, ShoppingList, WeekPlan } from '@/types'
import { useAuth } from '@/store/use-auth'

interface UsePlanResult {
  plan: WeekPlan
  budget: BudgetSummary
  shoppingList: ShoppingList
  recommendations: Recommendation[]
}

/**
 * Centraliza el plan semanal ajustado al presupuesto del hogar y los datos
 * derivados (presupuesto, lista de compras y recomendaciones).
 */
export function usePlan(): UsePlanResult {
  const weeklyBudget = useAuth((s) => s.household.weeklyBudget)

  return useMemo(() => {
    const plan: WeekPlan = { ...mockWeekPlan, budget: weeklyBudget }
    return {
      plan,
      budget: summarizePlanBudget(plan),
      shoppingList: { ...buildShoppingList(plan), budget: weeklyBudget },
      recommendations: generateRecommendations(plan),
    }
  }, [weeklyBudget])
}
