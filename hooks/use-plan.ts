'use client'

import { useMemo } from 'react'
import { mockWeekPlan } from '@/data/mock-plan'
import { summarizePlanBudget, type BudgetSummary } from '@/lib/budget'
import { generateRecommendations } from '@/lib/recommendations'
import { adaptPlan } from '@/lib/household-plan'
import { householdPortions } from '@/lib/portions'
import { buildShoppingList } from '@/lib/shopping'
import type { Recommendation, ShoppingList, WeekPlan } from '@/types'
import { useAuth } from '@/store/use-auth'
import { useMealPlan } from '@/store/use-meal-plan'

interface UsePlanResult {
  plan: WeekPlan
  budget: BudgetSummary
  shoppingList: ShoppingList
  recommendations: Recommendation[]
  /** Porciones por comida del hogar (adultos + niños × 0.75). */
  portions: number
  /** Personas del hogar. */
  people: number
}

/**
 * Centraliza el plan semanal ajustado al presupuesto del hogar y los datos
 * derivados (presupuesto, lista de compras y recomendaciones).
 */
export function usePlan(): UsePlanResult {
  const household = useAuth((s) => s.household)
  const overrides = useMealPlan((s) => s.overrides)

  return useMemo(() => {
    // El menú base se adapta al hogar: restricciones, preferencias, presupuesto, despensa y loncheras.
    const plan = adaptPlan(mockWeekPlan, household, overrides)
    const portions = plan.portions ?? householdPortions(household)
    return {
      plan,
      budget: summarizePlanBudget(plan),
      shoppingList: { ...buildShoppingList(plan), budget: household.weeklyBudget },
      recommendations: generateRecommendations(plan),
      portions,
      people: household.members,
    }
  }, [overrides, household])
}
