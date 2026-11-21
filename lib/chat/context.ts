import { mealTypeLabels, weekdayLabels } from '@/data/mock-plan'
import { dayNutrition } from '@/lib/nutrition'
import type { ChatContext, ShoppingList, WeekPlan } from '@/types'

const mealTypes = ['desayuno', 'almuerzo', 'cena'] as const

/** Lo que el asistente necesita saber del hogar, resumido para mandarlo con cada pregunta. */
export function buildChatContext(
  plan: WeekPlan,
  list: ShoppingList,
  shoppingTotal: number,
): Required<ChatContext> {
  return {
    weeklyBudget: plan.budget,
    menu: plan.days.map((day) => {
      const total = dayNutrition(day)
      return {
        day: weekdayLabels[day.day],
        meals: mealTypes.map((type) => ({
          type: mealTypeLabels[type],
          name: day[type].name,
          kcal: Math.round(day[type].nutrition.calories),
        })),
        kcal: Math.round(total.calories),
        proteinG: Math.round(total.protein),
        carbsG: Math.round(total.carbs),
        fatG: Math.round(total.fats),
      }
    }),
    shoppingList: list.items.map((item) => ({ name: item.name, quantity: item.quantity })),
    shoppingTotal: Math.round(shoppingTotal * 100) / 100,
  }
}
