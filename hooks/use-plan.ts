'use client'

import { useMemo } from 'react'
import { mockMealsById } from '@/data/mock-meals'
import { mockWeekPlan } from '@/data/mock-plan'
import { summarizePlanBudget, type BudgetSummary } from '@/lib/budget'
import { generateRecommendations } from '@/lib/recommendations'
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
  const weeklyBudget = useAuth((s) => s.household.weeklyBudget)
  const members = useAuth((s) => s.household.members)
  const children = useAuth((s) => s.household.children)
  const overrides = useMealPlan((s) => s.overrides)

  return useMemo(() => {
    const portions = householdPortions({ members, children })
    const plan: WeekPlan = {
      ...mockWeekPlan,
      budget: weeklyBudget,
      portions,
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
      portions,
      people: members,
    }
  }, [overrides, weeklyBudget, members, children])
}
