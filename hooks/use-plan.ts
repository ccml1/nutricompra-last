'use client'

import { useMemo } from 'react'
import { mockMealsById } from '@/data/mock-meals'
import { mockWeekPlan } from '@/data/mock-plan'
import { summarizePlanBudget, type BudgetSummary } from '@/lib/budget'
import { generateRecommendations } from '@/lib/recommendations'
import { buildShoppingList } from '@/lib/shopping'
import type { Recommendation, ShoppingList, WeekPlan } from '@/types'
import { useAuth } from '@/store/use-auth'
import { useMealPlan } from '@/store/use-meal-plan'

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
  const overrides = useMealPlan((s) => s.overrides)

  return useMemo(() => {
    const plan: WeekPlan = {
      ...mockWeekPlan,
      budget: weeklyBudget,
      days: mockWeekPlan.days.map((day) => ({
        ...day,
        desayuno: mockMealsById[overrides[`${day.day}-desayuno`] ?? day.desayuno.id] ?? day.desayuno,
        almuerzo: mockMealsById[overrides[`${day.day}-almuerzo`] ?? day.almuerzo.id] ?? day.almuerzo,
        cena: mockMealsById[overrides[`${day.day}-cena`] ?? day.cena.id] ?? day.cena,
      })),
    }
    return {
      plan,
      budget: summarizePlanBudget(plan),
      shoppingList: { ...buildShoppingList(plan), budget: weeklyBudget },
      recommendations: generateRecommendations(plan),
    }
  }, [overrides, weeklyBudget])
}
