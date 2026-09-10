'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MealType, Weekday } from '@/types'

/**
 * Guarda los reemplazos de comidas hechos por el usuario sobre el plan base
 * (`mockWeekPlan`). Solo persiste el id de la comida elegida por día y tipo;
 * `usePlan` resuelve esos ids contra los datos existentes para reconstruir el
 * plan efectivo. Reemplazar el origen mock por una API mantiene esta superficie.
 */
interface MealPlanState {
  overrides: Record<string, string>
  replaceMeal: (day: Weekday, mealType: MealType, mealId: string) => void
  resetMeal: (day: Weekday, mealType: MealType) => void
  resetPlan: () => void
}

export const overrideKey = (day: Weekday, mealType: MealType) => `${day}-${mealType}`

export const useMealPlan = create<MealPlanState>()(
  persist(
    (set) => ({
      overrides: {},
      replaceMeal: (day, mealType, mealId) =>
        set((state) => ({
          overrides: { ...state.overrides, [overrideKey(day, mealType)]: mealId },
        })),
      resetMeal: (day, mealType) =>
        set((state) => {
          const next = { ...state.overrides }
          delete next[overrideKey(day, mealType)]
          return { overrides: next }
        }),
      resetPlan: () => set({ overrides: {} }),
    }),
    { name: 'nutricompra-plan' },
  ),
)
